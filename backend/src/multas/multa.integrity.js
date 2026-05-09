import { recordIntegrityMismatch } from "../infra/launchhealth.js";
import { multaFlowLog } from "./multa.debuglog.js";
import {
  MultaOpsEventName,
  recordMultaOpsEvent,
} from "./multa.opstelemetry.js";
import { updateMultaErrorState } from "./multa.ops.persistence.js";
import {
  CaseState,
  normalizeCaseState,
  isPaidCaseState,
} from "./multaCaseState.js";

export const MULTA_ERROR_STATE = "ERROR_STATE";

/**
 * Corrige filas imposibles (pago vs reporte). Idempotente.
 * @returns {Promise<boolean>} true si se persistió ERROR_STATE
 */
export async function reconcileCorruptMultaFromRow(multa) {
  const cs = multa ? normalizeCaseState(multa.caseState, multa) : null;
  if (!multa || cs === CaseState.FAILED) {
    return false;
  }

  const hasBody = Boolean(multa.dischargeBody?.length);
  const paidConfirmed = isPaidCaseState(cs);

  let reason = null;
  if (paidConfirmed && !hasBody) {
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
    caseState: cs,
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
