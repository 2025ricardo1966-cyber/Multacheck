import {
  detectMultaInvariantViolations,
  getOpsMetricsSnapshot,
} from "../multas/multa.opstelemetry.js";
import { reconcileCorruptMultaFromRow } from "../multas/multa.integrity.js";
import { findMultaDebugById } from "./admin.multa.persistence.js";

export async function getMultaDebug(req, res) {
  try {
    const { multaId } = req.params;
    const multa = await findMultaDebugById(multaId);

    if (!multa) {
      return res.status(404).json({ error: "Multa no encontrada" });
    }

    const reconciled = await reconcileCorruptMultaFromRow(multa);
    let row = multa;
    if (reconciled) {
      row = await findMultaDebugById(multaId);
    }

    const {
      opsEvents,
      dischargeBody,
      resultJson,
      paymentStatus: _paymentStatus,
      lifecycleState: _lifecycleState,
      paid: _paid,
      ...multaRest
    } = row;

    const violations = detectMultaInvariantViolations(row);

    res.json({
      success: true,
      data: {
        multa: {
          ...multaRest,
          dischargeBodyLength: dischargeBody?.length ?? 0,
          hasResultJson: Boolean(resultJson),
        },
        trace: {
          created: row.traceCreatedAt,
          analyzed: row.traceAnalyzedAt,
          checkoutCreated: row.traceCheckoutAt,
          paymentConfirmed: row.tracePaidAt,
          reportGenerated: row.traceReportAt,
        },
        reconciled,
        events: opsEvents.map((e) => ({
          id: e.id,
          event: e.event,
          payload: e.payload,
          createdAt: e.createdAt,
        })),
        violations,
        metrics: getOpsMetricsSnapshot(),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
