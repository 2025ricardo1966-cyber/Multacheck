import { getStripe, syncStripeSubscription } from "./stripe.service.js";
import { logAudit } from "../audit/audit.service.js";
import { AuditAction } from "../audit/audit.model.js";
import { isFeatureReportGenerationEnabled } from "../config/launchflags.js";
import {
  recordReportGenerationBlocked,
  recordWebhookFailure,
} from "../infra/launchhealth.js";
import * as multaPersistence from "../multas/multa.persistence.js";
import { multaFlowLog } from "../multas/multa.debuglog.js";
import { CaseState } from "../multas/multaCaseState.js";
import prisma from "../db/prisma.js";
import { logPayment } from "../config/logger.js";
import {
  claimWebhookInboxForProcessing,
  findProcessedWebhookEvent,
  markWebhookInboxFailed,
  markWebhookInboxProcessed,
} from "./webhook.persistence.js";

/** Errores que la cola puede reintentar (DB temporal, finalize, feature flag). */
export class StripeWebhookRetryError extends Error {
  constructor(message, meta = {}) {
    super(message);
    this.name = "StripeWebhookRetryError";
    this.meta = meta;
  }
}

async function processWebhookEventBody(event) {
  const stripe = getStripe();
  if (!stripe) {
    throw new StripeWebhookRetryError("Stripe client unavailable");
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;

      const multaIdRaw = session.metadata?.multaId;
      const multaId =
        typeof multaIdRaw === "string" && multaIdRaw.trim().length > 0
          ? multaIdRaw.trim()
          : null;

      const isDischargePayment =
        session.mode === "payment" &&
        session.payment_status === "paid" &&
        multaId != null;

      if (isDischargePayment) {
        if (!isFeatureReportGenerationEnabled()) {
          recordReportGenerationBlocked();
          multaFlowLog("REPORT_GEN_DISABLED_WEBHOOK_RETRY", {
            multaId,
            stripeEventId: event.id,
          });
          throw new StripeWebhookRetryError("FEATURE_REPORT_DISABLED", {
            multaId,
          });
        }

        const pi = session.payment_intent;
        const paymentIntentId =
          typeof pi === "string"
            ? pi
            : pi && typeof pi === "object" && "id" in pi
              ? String(pi.id)
              : null;

        let finalized =
          await multaPersistence.finalizeMultaDischargeFromWebhook(multaId, {
            stripeSessionId: session.id,
            paymentIntentId,
          });
        if (!finalized) {
          finalized =
            await multaPersistence.reconcileMultaDischargeFromStripeSession(
              session.id
            );
        }
        if (!finalized) {
          multaFlowLog("PAYMENT_WEBHOOK_FINALIZE_FAILED", {
            multaId,
            stripeCheckoutSessionId: session.id,
          });
          throw new StripeWebhookRetryError("FINALIZE_NOOP", { multaId });
        }
        logPayment(multaId, "checkout.completed", {
          amount: session.amount_total,
          currency: session.currency,
          stripeSessionId: session.id,
        });
        break;
      }

      if (session.mode === "subscription" && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id
        );
        await syncStripeSubscription(sub);
      }
      break;
    }
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed": {
      const session = event.data.object;
      const multaIdRaw = session.metadata?.multaId;
      const mid =
        typeof multaIdRaw === "string" && multaIdRaw.trim().length > 0
          ? multaIdRaw.trim()
          : null;
      if (mid && session.mode === "payment") {
        await prisma.multa.updateMany({
          where: { id: mid, caseState: CaseState.PAYMENT_PENDING },
          data: { caseState: CaseState.FAILED },
        });
        multaFlowLog("CHECKOUT_SESSION_NOT_PAID", {
          multaId: mid,
          type: event.type,
        });
      }
      break;
    }
    case "payment_intent.succeeded":
    case "payment_intent.payment_failed": {
      multaFlowLog("STRIPE_PAYMENT_INTENT_EVENT", {
        type: event.type,
        id: event.data.object?.id,
      });
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await syncStripeSubscription(event.data.object);
      break;
    }
    default:
      break;
  }

  const md = event.data.object?.metadata || {};
  const webhookTenantId =
    md.tenantId && typeof md.tenantId === "string" ? md.tenantId : null;

  await logAudit({
    tenantId: webhookTenantId,
    userId: "system",
    action: AuditAction.BILLING_WEBHOOK_PROCESSED,
    metadata: { type: event.type, id: event.id },
  });
}

/**
 * Procesa un evento Stripe ya verificado (firma OK) con idempotencia en DB.
 * `payload`: { id, type, data } compatible con Stripe.Event parcial.
 */
export async function processStripeWebhookJob(payload) {
  const event = payload;

  const alreadyProcessed = await findProcessedWebhookEvent(event.id);
  if (alreadyProcessed) {
    multaFlowLog("STRIPE_WEBHOOK_DUPLICATE_DELIVERY", {
      stripeEventId: event.id,
      type: event.type,
      phase: "processed_marker",
    });
    return { duplicate: true, cached: true };
  }

  const claim = await claimWebhookInboxForProcessing(event.id);
  if (claim.kind === "already_processed") {
    return { duplicate: true, cached: true };
  }
  if (claim.kind === "in_flight") {
    multaFlowLog("STRIPE_WEBHOOK_DUPLICATE_DELIVERY", {
      stripeEventId: event.id,
      phase: "in_flight",
    });
    return { duplicate: true, cached: true };
  }
  if (claim.kind === "missing") {
    multaFlowLog("STRIPE_WEBHOOK_INBOX_MISSING", {
      stripeEventId: event.id,
      type: event.type,
    });
  }

  try {
    await processWebhookEventBody(event);
    await markWebhookInboxProcessed(event.id);
    return { ok: true, cached: false };
  } catch (error) {
    if (event?.id) {
      await markWebhookInboxFailed(event.id, error?.message).catch(() => {});
    }
    throw error;
  }
}

export function recordWebhookJobDeadLetter(event, error) {
  recordWebhookFailure();
  multaFlowLog("STRIPE_WEBHOOK_DEAD_LETTER", {
    stripeEventId: event?.id,
    type: event?.type,
    message: error?.message,
  });
}
