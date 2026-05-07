import { recordIntegrityMismatch } from "../infra/launchhealth.js";
import { multaFlowLog } from "./multa.debuglog.js";
import {
  MultaOpsEventName,
  recordMultaOpsEvent,
} from "./multa.opstelemetry.js";
import { updateMultaErrorState } from "./multa.ops.persistence.js";

const PAYMENT_STATUS_PAID = "paid";
export const MULTA_ERROR_STATE = "ERROR_STATE";

/**
 * Corrige filas imposibles (pago vs reporte). Idempotente.
 * @returns {Promise<boolean>} true si se persistió ERROR_STATE
 */
export async function reconcileCorruptMultaFromRow(multa) {
  if (!multa || multa.lifecycleState === MULTA_ERROR_STATE) {
    return false;
  }

  const paidConfirmed =
    multa.paid === true && multa.paymentStatus === PAYMENT_STATUS_PAID;
  const hasBody = Boolean(multa.dischargeBody?.length);

  let reason = null;
  if (
    paidConfirmed &&
    !hasBody &&
    (multa.lifecycleState === "REPORT_READY" ||
      multa.lifecycleState === "PAID_CONFIRMED")
  ) {
    reason = "PAID_NO_REPORT_BODY";
  } else if (hasBody && !paidConfirmed) {
    reason = "REPORT_BODY_WITHOUT_PAID_CONFIRMATION";
  }

  if (!reason) {
    return false;
  }

  multaFlowLog("INTEGRITY_ERROR_STATE", {
    multaId: multa.id,
    reason,
    lifecycleState: multa.lifecycleState,
  });
  recordIntegrityMismatch();

  await updateMultaErrorState(multa.id);

  await recordMultaOpsEvent(multa.id, MultaOpsEventName.INVARIANT_VIOLATION, {
    code: "ERROR_STATE",
    reason,
    severity: "critical",
  });

  return true;
}
