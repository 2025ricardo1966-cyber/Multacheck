import { getLatencySpikeMultiplier } from "./config.js";
import { telemetryIncrement, telemetryLatencyStats } from "./telemetryMetrics.js";
import {
  computePayloadSnapshotHash,
  redactForSnapshot,
} from "./payloadSnapshot.js";

/** Traces con `process_multa.enter` sin `process_multa.exit` antes del cierre HTTP. */
const processMultaPendingTraces = new Set();

function emitAnomaly(sinkFn, base, anomalyType, payload) {
  const payloadRedacted = /** @type {Record<string, unknown>} */ (
    redactForSnapshot(payload)
  );
  sinkFn({
    request_id: base.request_id,
    trace_id: base.trace_id,
    span_id: base.span_id,
    module_source: "telemetry.anomaly",
    event_type: anomalyType,
    timestamp: new Date().toISOString(),
    severity_level: "warn",
    payload_snapshot_hash: computePayloadSnapshotHash(payload),
    payload_redacted: payloadRedacted,
  });
}

/**
 * Reglas fijas (no ML): picos de latencia en `process_multa.exit`, segmentos de pipeline abiertos.
 * @param {Record<string, unknown>} record evento ya materializado
 * @param {(r: Record<string, unknown>) => void} sinkFn
 */
export function runTelemetryAnomalyRules(record, sinkFn) {
  const traceId = String(record.trace_id ?? "");
  const moduleSource = String(record.module_source ?? "");
  const eventType = String(record.event_type ?? "");

  if (eventType === "multa.http.analyze.enter") {
    telemetryIncrement("count:multa.analyze.enter");
  }

  if (eventType === "multa.http.analyze.exit") {
    telemetryIncrement("count:multa.analyze.exit");
  }

  if (moduleSource === "multa.pipeline" && eventType === "process_multa.enter") {
    processMultaPendingTraces.add(traceId);
  }

  if (moduleSource === "multa.pipeline" && eventType === "process_multa.exit") {
    processMultaPendingTraces.delete(traceId);
  }

  if (
    moduleSource === "multa.pipeline" &&
    eventType === "process_multa.exit" &&
    record.payload_redacted &&
    typeof record.payload_redacted === "object"
  ) {
    const pr = /** @type {Record<string, unknown>} */ (record.payload_redacted);
    const dur = pr.duration_ms;
    if (typeof dur === "number" && Number.isFinite(dur)) {
      const key = "latency_ms:multa.pipeline:process_multa.exit";
      const stats = telemetryLatencyStats(key);
      const mult = getLatencySpikeMultiplier();
      if (stats && stats.count >= 5 && dur > stats.avg_ms * mult) {
        emitAnomaly(sinkFn, record, "anomaly.latency.spike", {
          metric_key: key,
          observed_ms: dur,
          avg_ms: stats.avg_ms,
          multiplier: mult,
        });
        telemetryIncrement("count:anomaly.latency.spike");
      }
    }
  }

  if (eventType === "http.request.completed") {
    const pr = record.payload_redacted;
    const path =
      typeof pr === "object" && pr && "path" in pr ? String(pr.path) : "";
    const method =
      typeof pr === "object" && pr && "method" in pr ? String(pr.method) : "";
    if (method === "POST" && path.endsWith("/multa/analyze")) {
      if (processMultaPendingTraces.has(traceId)) {
        emitAnomaly(sinkFn, record, "anomaly.pipeline.process_multa_unclosed", {
          trace_id: traceId,
        });
        telemetryIncrement("count:anomaly.process_multa_unclosed");
        processMultaPendingTraces.delete(traceId);
      }
    }
  }
}

/** @internal */
export function __resetTelemetryAnomalyForTests() {
  processMultaPendingTraces.clear();
}
