/**
 * Única fuente de verdad operativa: caseState (columna `Multa.caseState`).
 * No inferir estado desde otras columnas.
 */

export const CaseState = Object.freeze({
  CREATED: "CREATED",
  ANALYZED: "ANALYZED",
  PAYMENT_PENDING: "PAYMENT_PENDING",
  PAID: "PAID",
  DISCHARGE_READY: "DISCHARGE_READY",
  DISCHARGED: "DISCHARGED",
  FAILED: "FAILED",
});

const ALL = new Set(Object.values(CaseState));

function coalesceValidCaseState(value) {
  const s = value != null && String(value).trim() !== "" ? String(value).trim() : "";
  return ALL.has(s) ? s : null;
}

/**
 * @param {string | null | undefined} raw
 * @param {import("@prisma/client").Multa | null} [multa]
 */
export function normalizeCaseState(raw, multa = null) {
  return (
    coalesceValidCaseState(raw) ??
    coalesceValidCaseState(multa?.caseState) ??
    CaseState.ANALYZED
  );
}

export function dischargeAvailableFromCaseState(caseState) {
  return (
    caseState === CaseState.DISCHARGE_READY || caseState === CaseState.DISCHARGED
  );
}

export function isPaidCaseState(caseState) {
  return (
    caseState === CaseState.PAID ||
    caseState === CaseState.DISCHARGE_READY ||
    caseState === CaseState.DISCHARGED
  );
}

export function allowsAnalyzeTransition(caseState) {
  return (
    caseState === CaseState.CREATED || caseState === CaseState.ANALYZED
  );
}

export function allowsCheckoutTransition(caseState) {
  return (
    caseState === CaseState.CREATED ||
    caseState === CaseState.ANALYZED ||
    caseState === CaseState.PAYMENT_PENDING ||
    caseState === CaseState.FAILED
  );
}
