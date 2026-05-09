import crypto from "node:crypto";
import { isTelemetryEnabled, getLatencyRollingWindow } from "./config.js";
import { telemetryStorage } from "./telemetryContext.js";
import {
  redactForSnapshot,
  computePayloadSnapshotHash,
} from "./payloadSnapshot.js";
import { appendTelemetryJsonl, mirrorTelemetryToPino } from "./telemetrySink.js";
import {
  telemetryIncrement,
  telemetryRecordLatency,
} from "./telemetryMetrics.js";
import { runTelemetryAnomalyRules } from "./telemetryAnomaly.js";

let emitDepth = 0;

/**
 * Evento unificado (no lanza; jamás altera flujo de negocio).
 * `_telemetryContextOverride` permite correlación fuera de HTTP (ej. jobs/lotes).
 *
 * @param {{
 *   module_source: string,
 *   event_type: string,
 *   severity_level?: string,
 *   payload?: Record<string, unknown>,
 *   _telemetryContextOverride?: { requestId?: string, traceId?: string, spanId?: string },
 * }} partial
 */
export function telemetryEmit(partial) {
  if (!isTelemetryEnabled()) return;
  if (emitDepth > 4) return;

  emitDepth++;
  try {
    const store = telemetryStorage.getStore();
    const ov = partial._telemetryContextOverride;

    const requestId = ov?.requestId ?? store?.requestId ?? "non-http";
    const traceId = ov?.traceId ?? store?.traceId ?? requestId;
    const spanId =
      ov?.spanId ?? store?.spanId ?? crypto.randomBytes(8).toString("hex");

    const payloadObj =
      partial.payload != null && typeof partial.payload === "object"
        ? /** @type {Record<string, unknown>} */ (partial.payload)
        : {};

    const payloadRedacted = /** @type {Record<string, unknown>} */ (
      redactForSnapshot(payloadObj)
    );
    const hash = computePayloadSnapshotHash(payloadObj);

    /** @type {Record<string, unknown>} */
    const record = {
      request_id: requestId,
      trace_id: traceId,
      span_id: spanId,
      module_source: partial.module_source,
      event_type: partial.event_type,
      timestamp: new Date().toISOString(),
      severity_level: partial.severity_level ?? "info",
      payload_snapshot_hash: hash,
      payload_redacted: payloadRedacted,
    };

    telemetryIncrement(
      `count:event:${partial.module_source}:${partial.event_type}`
    );

    if (
      partial.module_source === "multa.pipeline" &&
      partial.event_type === "process_multa.exit" &&
      typeof payloadObj.duration_ms === "number"
    ) {
      telemetryRecordLatency(
        "latency_ms:multa.pipeline:process_multa.exit",
        payloadObj.duration_ms,
        getLatencyRollingWindow()
      );
    }

    appendTelemetryJsonl(record);
    mirrorTelemetryToPino(record);

    runTelemetryAnomalyRules(record, (anomalyRecord) => {
      telemetryIncrement(
        `count:event:${anomalyRecord.module_source}:${anomalyRecord.event_type}`
      );
      appendTelemetryJsonl(anomalyRecord);
      mirrorTelemetryToPino(anomalyRecord);
    });
  } catch (e) {
    console.error("[telemetry] emit failed:", e?.message ?? e);
  } finally {
    emitDepth--;
  }
}
