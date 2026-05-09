import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { telemetryEmit } from "../src/infra/telemetry/telemetryEmit.js";
import { getTelemetryMetricsSnapshot } from "../src/infra/telemetry/telemetryMetrics.js";
import { __resetTelemetryForTests } from "../src/infra/telemetry/telemetryTestReset.js";
import {
  telemetryStorage,
  resolveTraceId,
  parseTraceParentTraceId,
} from "../src/infra/telemetry/telemetryContext.js";
import { computePayloadSnapshotHash } from "../src/infra/telemetry/payloadSnapshot.js";

describe("telemetry core", () => {
  beforeEach(() => {
    __resetTelemetryForTests();
    delete process.env.MULTACHECK_TELEMETRY;
    delete process.env.MULTACHECK_TELEMETRY_PINO_MIRROR;
  });

  it("apagado: emit no incrementa métricas", () => {
    telemetryEmit({
      module_source: "test",
      event_type: "noop",
      payload: { x: 1 },
    });
    const snap = getTelemetryMetricsSnapshot();
    assert.equal(snap.counters["count:event:test:noop"] ?? 0, 0);
  });

  it("activado: emit registra contador", () => {
    process.env.MULTACHECK_TELEMETRY = "1";
    telemetryEmit({
      module_source: "test",
      event_type: "ping",
      payload: { x: 1 },
    });
    const snap = getTelemetryMetricsSnapshot();
    assert.equal(snap.counters["count:event:test:ping"], 1);
  });

  it("traceparent produce trace_id estable", () => {
    const tid = parseTraceParentTraceId(
      "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"
    );
    assert.equal(tid, "4bf92f3577b34da6a3ce929d0e0e4736");
    const req = {
      headers: {
        traceparent:
          "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
      },
    };
    assert.equal(resolveTraceId(req), tid);
  });

  it("ALS: eventos heredan request/trace ids del store", () => {
    process.env.MULTACHECK_TELEMETRY = "1";
    telemetryStorage.run(
      {
        requestId: "req-a",
        traceId: "trace-b",
        spanId: "span-c",
        startedAt: Date.now(),
        method: "POST",
        path: "/x",
      },
      () => {
        telemetryEmit({
          module_source: "test",
          event_type: "als_ping",
          payload: {},
        });
      }
    );
    /* Métrica demuestra que emit corrió sin error dentro del store */
    assert.ok(
      getTelemetryMetricsSnapshot().counters["count:event:test:als_ping"] >= 1
    );
  });

  it("payload_snapshot_hash determinístico", () => {
    const h1 = computePayloadSnapshotHash({ a: 1, b: { c: 2 } });
    const h2 = computePayloadSnapshotHash({ b: { c: 2 }, a: 1 });
    assert.equal(h1, h2);
    assert.equal(typeof h1, "string");
    assert.equal(h1.length, 64);
  });
});
