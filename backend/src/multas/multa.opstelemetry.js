import { createMultaOpsEvent } from "./multa.ops.persistence.js";
import {
  normalizeCaseState,
  isPaidCaseState,
} from "./multaCaseState.js";

/** Eventos de auditoría operativa (JSON en consola + fila en DB). */
export const MultaOpsEventName = Object.freeze({
  MULTA_CREATED: "MULTA_CREATED",
  SEMAPHORE_ASSIGNED: "SEMAPHORE_ASSIGNED",
  CHECKOUT_SESSION_CREATED: "CHECKOUT_SESSION_CREATED",
  STRIPE_PAYMENT_CONFIRMED: "STRIPE_PAYMENT_CONFIRMED",
  REPORT_GENERATED: "REPORT_GENERATED",
  REPORT_FETCHED: "REPORT_FETCHED",
  INVARIANT_VIOLATION: "INVARIANT_VIOLATION",
});

const metrics = {
  multasCreated: 0,
  checkoutsCreated: 0,
  paymentsConfirmed: 0,
  reportsGenerated: 0,
  reportsFetched: 0,
};

export function bumpOpsMetric(key) {
  if (Object.prototype.hasOwnProperty.call(metrics, key)) {
    metrics[key] += 1;
  }
}

export function getOpsMetricsSnapshot() {
  const checkoutToPaid =
    metrics.checkoutsCreated > 0
      ? Number(
          (metrics.paymentsConfirmed / metrics.checkoutsCreated).toFixed(4)
        )
      : null;
  return {
    ...metrics,
    conversionCheckoutToPaid: checkoutToPaid,
  };
}

/**
 * Log estructurado (una línea JSON) + persistencia best-effort.
 */
export async function recordMultaOpsEvent(multaId, event, payload = {}) {
  const safePayload =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? payload
      : { value: payload };
  const line = {
    tag: event,
    t: new Date().toISOString(),
    multaId,
    ...safePayload,
  };
  console.log(JSON.stringify(line));
  try {
    await createMultaOpsEvent(multaId, event, safePayload);
  } catch (err) {
    console.log(
      JSON.stringify({
        tag: "OPS_EVENT_PERSIST_FAILED",
        t: new Date().toISOString(),
        multaId,
        event,
        message: err.message,
      })
    );
  }
}

export function detectMultaInvariantViolations(multa) {
  const violations = [];
  if (!multa) return violations;

  const cs = normalizeCaseState(multa.caseState, multa);
  const hasReport = Boolean(multa.dischargeBody?.length);
  const paidConfirmed = isPaidCaseState(cs);

  if (hasReport && !paidConfirmed) {
    violations.push({
      code: "REPORT_WITHOUT_PAID_CONFIRMATION",
      severity: "critical",
    });
  }

  if (paidConfirmed && !hasReport) {
    violations.push({
      code: "PAID_NO_REPORT_BODY",
      severity: "critical",
    });
  }

  if (
    paidConfirmed &&
    !multa.stripePaymentIntentId &&
    !multa.stripeCheckoutSessionId
  ) {
    violations.push({
      code: "PAID_WITHOUT_STRIPE_ARTIFACT",
      severity: "high",
    });
  }

  return violations;
}

export async function logMultaInvariantViolationsIfAny(multa, source) {
  const list = detectMultaInvariantViolations(multa);
  for (const item of list) {
    await recordMultaOpsEvent(multa.id, MultaOpsEventName.INVARIANT_VIOLATION, {
      ...item,
      source,
    });
  }
  return list;
}
