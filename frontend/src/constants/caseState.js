/** Alineado con backend `multaCaseState.js` — única fuente de verdad en UI. */
export const CaseState = Object.freeze({
  CREATED: "CREATED",
  ANALYZED: "ANALYZED",
  PAYMENT_PENDING: "PAYMENT_PENDING",
  PAID: "PAID",
  DISCHARGE_READY: "DISCHARGE_READY",
  DISCHARGED: "DISCHARGED",
  FAILED: "FAILED",
});

export function dischargeAvailableFromCaseState(cs) {
  return (
    cs === CaseState.DISCHARGE_READY || cs === CaseState.DISCHARGED
  );
}

export function canStartCheckout(cs) {
  if (!cs) return true;
  return (
    cs === CaseState.CREATED ||
    cs === CaseState.ANALYZED ||
    cs === CaseState.PAYMENT_PENDING ||
    cs === CaseState.FAILED
  );
}
