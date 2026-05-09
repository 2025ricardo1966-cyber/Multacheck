import { safeTransaction } from "../db/safeTransaction.js";
import { withAdvisoryLock } from "../db/advisoryLock.js";
import { buildAnalyzeRequestHash } from "./analyzeCanonical.js";
import { runWithConcurrencyLock } from "./multa.concurrency.js";
import prisma from "../db/prisma.js";
import { buildDischargeText } from "./dischargetemplate.js";
import { multaFlowLog } from "./multa.debuglog.js";
import { CaseState, normalizeCaseState } from "./multaCaseState.js";
import { getStripe } from "../billing/stripe.service.js";

/**
 * =========================================================
 * MULTA PERSISTENCE — analyze content vs idempotency (FINAL B)
 * =========================================================
 *
 * requestHash — business identity (deterministic across clients):
 *   sha256(JSON.stringify(canonicalizeAnalyzeBody(body)))
 *   Includes ONLY: country, type, description, rawInput?, label?, trafficLight?
 *   NEVER includes: resultJson (under any condition), idempotencyKey, transport metadata.
 *   Backed by @@unique([tenantId, userId, requestHash]).
 *
 * idempotencyKey — retry protection only (options.idempotencyKey):
 *   Optional lookup before create path (same tenant + user). Does not affect requestHash.
 *   Not part of the business-dedupe compound key above (tenantId + userId + requestHash).
 *
 * Concurrency:
 *   Serializable transaction + safeTransaction retries + pg_advisory_xact_lock on
 *   `${tenantId}:${userId}:${requestHash}` inside the tx (cross-instance safe on same DB).
 *   findUnique / create (+ P2002 recovery); no upsert.
 *   In-process lock keyed by tenant:user:requestHash reduces contention.
 */

export { canonicalizeAnalyzeBody, buildAnalyzeRequestHash } from "./analyzeCanonical.js";

function buildMultaCreateData(body, { tenantId, userId, requestHash, idempotencyKey }) {
  return {
    tenantId,
    userId,
    requestHash,
    country: body?.country ?? "AR",
    type: body?.type ?? "transito",
    description: body?.description ?? null,
    rawInput: body?.rawInput ?? null,
    label: body?.label ?? null,
    trafficLight: body?.trafficLight ?? null,
    idempotencyKey: idempotencyKey ?? null,
    resultJson: body?.resultJson ?? {},
    caseState: CaseState.CREATED,
  };
}

async function resolveAnalyzeInTransaction(tx, body, options, tenantId, userId, requestHash) {
  return withAdvisoryLock(
    tx,
    `${tenantId}:${userId}:${requestHash}`,
    async () => {
      const idempotencyKey = options?.idempotencyKey ?? null;

      if (idempotencyKey) {
        const byKey = await tx.multa.findFirst({
          where: { idempotencyKey, tenantId, userId },
        });
        if (byKey) {
          return { success: true, data: byKey };
        }
      }

      const compoundWhere = {
        tenantId_userId_requestHash: {
          tenantId,
          userId,
          requestHash,
        },
      };

      let existingByCompound = await tx.multa.findUnique({
        where: compoundWhere,
      });

      if (existingByCompound) {
        const touched = await tx.multa.update({
          where: { id: existingByCompound.id },
          data: { updatedAt: new Date() },
        });
        return { success: true, data: touched };
      }

      try {
        const created = await tx.multa.create({
          data: buildMultaCreateData(body, {
            tenantId,
            userId,
            requestHash,
            idempotencyKey,
          }),
        });
        return { success: true, data: created };
      } catch (err) {
        if (err?.code === "P2002") {
          if (idempotencyKey) {
            const recoveredByKey = await tx.multa.findFirst({
              where: { idempotencyKey, tenantId, userId },
            });
            if (recoveredByKey) {
              return { success: true, data: recoveredByKey };
            }
          }
          const recovered = await tx.multa.findUnique({
            where: compoundWhere,
          });
          if (recovered) {
            const touched = await tx.multa.update({
              where: { id: recovered.id },
              data: { updatedAt: new Date() },
            });
            return { success: true, data: touched };
          }
        }
        throw err;
      }
    }
  );
}

export async function analyzeAndPersist(auth, body, options = {}) {
  if (!auth?.tenantId || !auth?.userId) {
    throw new Error("Missing auth context");
  }

  const tenantId = String(auth.tenantId);
  const userId = String(auth.userId);

  const requestHash = buildAnalyzeRequestHash(body);

  const lockKey = `analyze:${tenantId}:${userId}:${requestHash}`;

  return runWithConcurrencyLock(lockKey, async () => {
    return safeTransaction(
      async (tx) =>
        resolveAnalyzeInTransaction(tx, body, options, tenantId, userId, requestHash),
      {
        maxWait: 15_000,
        timeout: 60_000,
      }
    );
  });
}

/**
 * Marca pago confirmado y genera informe — llamado desde Stripe webhook (backend orquesta estado).
 * Idempotente. Transición: PAYMENT_PENDING|PAID → PAID → DISCHARGE_READY (misma transacción).
 *
 * @returns {Promise<boolean>} false si multa no existe o sessionId no coincide con la fila
 */
export async function finalizeMultaDischargeFromWebhook(
  multaId,
  { stripeSessionId, paymentIntentId } = {}
) {
  if (!multaId || typeof multaId !== "string") {
    return false;
  }

  const multa = await prisma.multa.findUnique({
    where: { id: multaId },
  });

  if (!multa) {
    multaFlowLog("FINALIZE_DISCHARGE_NO_MULTA", { multaId });
    return false;
  }

  const cs = normalizeCaseState(multa.caseState, multa);

  if (
    (cs === CaseState.DISCHARGE_READY || cs === CaseState.DISCHARGED) &&
    multa.dischargeBody &&
    multa.dischargeBody.length > 0
  ) {
    multaFlowLog("FINALIZE_DISCHARGE_IDEMPOTENT", { multaId });
    return true;
  }

  const sessionOk =
    !stripeSessionId ||
    !multa.stripeCheckoutSessionId ||
    multa.stripeCheckoutSessionId === stripeSessionId;

  if (!sessionOk) {
    multaFlowLog("FINALIZE_DISCHARGE_SESSION_MISMATCH", {
      multaId,
      expected: multa.stripeCheckoutSessionId,
      got: stripeSessionId,
    });
    return false;
  }

  await prisma.$transaction(async (tx) => {
    await tx.multa.update({
      where: { id: multaId },
      data: {
        caseState: CaseState.PAID,
        tracePaidAt: new Date(),
        ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
        ...(stripeSessionId && !multa.stripeCheckoutSessionId
          ? { stripeCheckoutSessionId: stripeSessionId }
          : {}),
      },
    });

    const row = await tx.multa.findUnique({ where: { id: multaId } });
    const dischargeBody = buildDischargeText(row);

    await tx.multa.update({
      where: { id: multaId },
      data: {
        dischargeBody,
        caseState: CaseState.DISCHARGE_READY,
      },
    });
  });

  multaFlowLog("FINALIZE_DISCHARGE_OK", { multaId });
  return true;
}

/**
 * Tras un fallo de finalize, recupera la sesión en Stripe y reintenta (misma firma de pago).
 */
export async function reconcileMultaDischargeFromStripeSession(stripeSessionId) {
  if (!stripeSessionId || typeof stripeSessionId !== "string") {
    return false;
  }

  const stripe = getStripe();
  if (!stripe) {
    multaFlowLog("STRIPE_RECONCILE_NO_CLIENT", {});
    return false;
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(stripeSessionId);
  } catch (e) {
    multaFlowLog("STRIPE_RECONCILE_RETRIEVE_FAILED", { message: e.message });
    return false;
  }

  if (session.mode !== "payment" || session.payment_status !== "paid") {
    return false;
  }

  const multaIdRaw = session.metadata?.multaId;
  const multaId =
    typeof multaIdRaw === "string" && multaIdRaw.trim().length > 0
      ? multaIdRaw.trim()
      : null;
  if (!multaId) return false;

  const multa = await prisma.multa.findUnique({ where: { id: multaId } });
  if (!multa) return false;

  if (
    multa.stripeCheckoutSessionId &&
    multa.stripeCheckoutSessionId !== session.id
  ) {
    await prisma.multa.update({
      where: { id: multaId },
      data: { stripeCheckoutSessionId: session.id },
    });
  }

  const pi = session.payment_intent;
  const paymentIntentId =
    typeof pi === "string"
      ? pi
      : pi && typeof pi === "object" && "id" in pi
        ? String(pi.id)
        : null;

  return finalizeMultaDischargeFromWebhook(multaId, {
    stripeSessionId: session.id,
    paymentIntentId,
  });
}
