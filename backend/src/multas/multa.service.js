import prisma from "../db/prisma.js";
import * as persistence from "./multa.persistence.js";
import stripe from "../billing/stripe.service.js";
import { processMulta } from "../services/multaservice.js";
import {
  CaseState,
  normalizeCaseState,
  dischargeAvailableFromCaseState,
  allowsAnalyzeTransition,
  allowsCheckoutTransition,
} from "./multaCaseState.js";
import { normalizeAnalyzeInput } from "./infractionNormalization.js";
import { publishDomainEvent } from "../application/domainEvents.port.js";

/**
 * Contrato mínimo de estado en TODAS las respuestas multa (siempre incluido).
 * Campos adicionales por endpoint van aparte (analyze, checkout URL, dischargeBody, etc.).
 */
export function toCaseStateOnlyResponse(multa) {
  const cs = normalizeCaseState(multa.caseState, multa);
  return {
    multaId: multa.id,
    caseState: cs,
    dischargeAvailable: dischargeAvailableFromCaseState(cs),
  };
}

function frontendBaseUrl() {
  return (
    process.env.FRONTEND_URL?.trim() ||
    process.env.CLIENT_ORIGIN?.trim() ||
    "http://localhost:5173"
  );
}

/** Línea de checkout “descargo” (mode=payment). Moneda/monto vía env; por defecto igual al histórico del repo (usd, 1000 = US$10.00). */
function stripeDischargePriceData() {
  const currency = (
    process.env.STRIPE_DISCHARGE_CURRENCY?.trim() || "usd"
  ).toLowerCase();
  const raw = process.env.STRIPE_DISCHARGE_UNIT_AMOUNT?.trim();
  const unitAmount = raw ? parseInt(raw, 10) : 1000;
  const amount = Number.isFinite(unitAmount) && unitAmount > 0 ? unitAmount : 1000;
  return {
    currency,
    product_data: {
      name: "Informe de descargo MultaCheck",
    },
    unit_amount: amount,
  };
}

/** Locale de Checkout (ej. es). Si no se define, Stripe elige automáticamente. */
function stripeCheckoutSessionLocale() {
  const loc = process.env.STRIPE_CHECKOUT_LOCALE?.trim();
  return loc || undefined;
}

function httpError(message, statusCode = 500) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

async function invokeProcessMulta(multaData, modeLabel) {
  const t0 = Date.now();
  publishDomainEvent({
    module_source: "multa.pipeline",
    type: "process_multa.enter",
    payload: { mode: modeLabel },
  });
  try {
    const analysis = await processMulta(multaData);
    publishDomainEvent({
      module_source: "multa.pipeline",
      type: "process_multa.exit",
      payload: {
        mode: modeLabel,
        duration_ms: Date.now() - t0,
        outcome: "ok",
      },
    });
    return analysis;
  } catch (e) {
    publishDomainEvent({
      module_source: "multa.pipeline",
      type: "process_multa.exit",
      severity_level: "error",
      payload: {
        mode: modeLabel,
        duration_ms: Date.now() - t0,
        outcome: "error",
      },
    });
    throw e;
  }
}

/** Salida plana del pipeline AI (`convertAIFormat`) o legacy `{ success, data }` desde motor JS. */
function fieldsFromProcessMulta(analysis) {
  if (
    analysis &&
    typeof analysis === "object" &&
    analysis.score != null &&
    analysis.trafficLight
  ) {
    const tl = String(analysis.trafficLight).toLowerCase();
    const trafficLight =
      tl === "green" ? "GREEN" : tl === "red" ? "RED" : "YELLOW";
    return {
      trafficLight,
      label: analysis.explanation ?? null,
      preview: {
        scoring: { finalScore: Number(analysis.score) || 0 },
        meta: { explanation: analysis.explanation ?? "" },
      },
    };
  }

  let trafficLight = "YELLOW";
  let label = null;
  let preview = {};

  if (analysis?.success && analysis.data) {
    if (analysis.data.trafficLight) {
      trafficLight = analysis.data.trafficLight;
    }
    label = analysis.data.label ?? null;
    if (
      analysis.data.preview &&
      typeof analysis.data.preview === "object"
    ) {
      preview = analysis.data.preview;
    }
  }

  return { trafficLight, label, preview };
}

async function findOwnedMulta(auth, multaId) {
  if (!multaId) return null;
  return prisma.multa.findFirst({
    where: {
      id: multaId,
      tenantId: auth.tenantId,
      userId: auth.userId,
    },
  });
}

/** GET /state — solo contrato de estado. */
function toMultaStatePublic(multa) {
  return toCaseStateOnlyResponse(multa);
}

/** Quita columnas legado del objeto persistido para no exponerlas por API. */
function stripLegacyDbFields(multa) {
  const {
    id: _id,
    paymentStatus: _paymentStatus,
    lifecycleState: _lifecycleState,
    paid: _paid,
    ...rest
  } = multa;
  return rest;
}

/**
 * Vista previa sin persistencia ni tenant — mismo motor `processMulta` que el analyze autenticado.
 */
export async function analyzeAnonymousFlow(body) {
  const { multaData } = normalizeAnalyzeInput(body ?? {});

  const analysis = await invokeProcessMulta(multaData, "anonymous_preview");
  const { trafficLight, label, preview } = fieldsFromProcessMulta(analysis);

  return {
    success: true,
    data: {
      trafficLight,
      label,
      resultJson: preview,
      anonymousPreview: true,
      dischargeAvailable: false,
    },
  };
}

export async function createMultaFlow(auth, body, options = {}) {
  const result = await persistence.analyzeAndPersist(auth, body, options);

  if (!result.success || !result.data?.id) {
    return result;
  }

  const multaRow = result.data;
  const prevCs = normalizeCaseState(multaRow.caseState, multaRow);
  const shouldSetAnalyzed = allowsAnalyzeTransition(prevCs);

  const mergedBody = {
    ...body,
    country: body?.country ?? multaRow.country ?? "AR",
    type: body?.type ?? multaRow.type ?? "transito",
    description:
      (body?.description ?? multaRow.description ?? "").trim() ||
      multaRow.description ||
      "",
  };
  const { multaData } = normalizeAnalyzeInput(mergedBody);

  const analysis = await invokeProcessMulta(multaData, "persisted_analyze");
  const { trafficLight, label, preview } = fieldsFromProcessMulta(analysis);

  const updated = await prisma.multa.update({
    where: { id: multaRow.id },
    data: {
      trafficLight,
      label,
      resultJson: preview,
      traceAnalyzedAt: new Date(),
      ...(shouldSetAnalyzed ? { caseState: CaseState.ANALYZED } : {}),
    },
  });

  const refreshed = await prisma.multa.findUnique({
    where: { id: updated.id },
  });

  const payload = {
    success: true,
    data: {
      trafficLight: refreshed.trafficLight,
      label: refreshed.label,
      resultJson: refreshed.resultJson,
      ...toCaseStateOnlyResponse(refreshed),
    },
  };

  if (options?.createCheckout) {
    const priceData = stripeDischargePriceData();
    const checkoutLocale = stripeCheckoutSessionLocale();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: priceData.currency,
            product_data: { name: "Servicio MultaCheck (informe de descargo)" },
            unit_amount: priceData.unit_amount,
          },
          quantity: 1,
        },
      ],
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      ...(checkoutLocale ? { locale: checkoutLocale } : {}),
    });

    return {
      ...payload,
      checkoutSession: session,
    };
  }

  return payload;
}

export async function createDischargeCheckoutFlow(auth, multaId, body = {}) {
  const multa = await findOwnedMulta(auth, multaId);
  if (!multa) {
    throw httpError("Multa no encontrada", 404);
  }

  const cs = normalizeCaseState(multa.caseState, multa);
  if (!allowsCheckoutTransition(cs)) {
    throw httpError("Estado del caso no permite iniciar pago", 409);
  }

  if (!stripe.checkout?.sessions) {
    throw httpError("Stripe no configurado", 503);
  }

  const base = frontendBaseUrl().replace(/\/$/, "");
  const successUrl =
    typeof body?.successUrl === "string"
      ? body.successUrl
      : `${base}/?resume=${encodeURIComponent(multa.id)}&payment=success`;
  const cancelUrl =
    typeof body?.cancelUrl === "string"
      ? body.cancelUrl
      : `${base}/?resume=${encodeURIComponent(multa.id)}&payment=cancel`;

  const priceData = stripeDischargePriceData();
  const checkoutLocale = stripeCheckoutSessionLocale();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: priceData,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      multaId: multa.id,
      tenantId: auth.tenantId,
      country: multa.country ?? "AR",
    },
    ...(checkoutLocale ? { locale: checkoutLocale } : {}),
  });

  await prisma.multa.update({
    where: { id: multa.id },
    data: {
      stripeCheckoutSessionId: session.id,
      traceCheckoutAt: new Date(),
      caseState: CaseState.PAYMENT_PENDING,
    },
  });

  const refreshed = await prisma.multa.findUnique({
    where: { id: multa.id },
  });

  return {
    url: session.url,
    sessionId: session.id,
    ...toCaseStateOnlyResponse(refreshed),
  };
}

export async function getPaymentStatusFlow(auth, multaId) {
  const multa = await findOwnedMulta(auth, multaId);
  if (!multa) {
    throw httpError("Multa no encontrada", 404);
  }

  return {
    success: true,
    data: toCaseStateOnlyResponse(multa),
  };
}

export async function getMultaStateFlow(auth, multaId) {
  const multa = await findOwnedMulta(auth, multaId);
  if (!multa) {
    throw httpError("Multa no encontrada", 404);
  }

  return toMultaStatePublic(multa);
}

export async function getMultaFullStateFlow(auth, multaId) {
  const multa = await findOwnedMulta(auth, multaId);
  if (!multa) {
    throw httpError("Multa no encontrada", 404);
  }

  return {
    ...toCaseStateOnlyResponse(multa),
    ...stripLegacyDbFields(multa),
  };
}

export async function getDischargeFlow(auth, multaId) {
  const multa = await findOwnedMulta(auth, multaId);
  if (!multa) {
    throw httpError("Multa no encontrada", 404);
  }

  const cs = normalizeCaseState(multa.caseState, multa);

  if (cs !== CaseState.DISCHARGE_READY && cs !== CaseState.DISCHARGED) {
    throw httpError("Informe no disponible: caso no listo para descarga", 403);
  }

  const body = multa.dischargeBody;
  if (body == null || String(body).length === 0) {
    throw httpError("Informe aún no generado", 404);
  }

  if (cs === CaseState.DISCHARGE_READY) {
    await prisma.multa.update({
      where: { id: multa.id },
      data: { caseState: CaseState.DISCHARGED },
    });
  }

  const refreshed = await prisma.multa.findUnique({
    where: { id: multa.id },
  });

  return {
    dischargeBody: body,
    ...toCaseStateOnlyResponse(refreshed),
  };
}
