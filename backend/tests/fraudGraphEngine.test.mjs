import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  runFraudSignalGraphEngine,
  sortRecordsByTime,
  normalizePlate,
} from "../src/fraud/fraudGraphEngine.js";

describe("fraudGraphEngine", () => {
  it("orden estable por tiempo + id", () => {
    const a = [
      { id: "b", occurredAt: "2026-05-01T00:00:00Z", jurisdictionKey: "AR:X", violationTypeKey: "v" },
      { id: "a", occurredAt: "2026-05-01T00:00:00Z", jurisdictionKey: "AR:X", violationTypeKey: "v" },
    ];
    const s = sortRecordsByTime(a);
    assert.equal(s[0].id, "a");
  });

  it("normaliza patente determinísticamente", () => {
    assert.equal(normalizePlate(" aa 111 bb "), "AA111BB");
    assert.equal(normalizePlate(""), null);
  });

  it("dataset vacío → sin señales agregadas", () => {
    const out = runFraudSignalGraphEngine([]);
    assert.equal(out.signalsAggregated.length, 0);
    assert.equal(out.graphSummary.nodeCount, 0);
  });

  it("fixture sintético produce señales explicables determinísticas", () => {
    const records = [
      {
        id: "m1",
        occurredAt: "2026-05-01T10:00:00.000Z",
        plate: "AB123CD",
        userId: "u1",
        jurisdictionKey: "AR:A",
        violationTypeKey: "velocidad",
      },
      {
        id: "m2",
        occurredAt: "2026-05-02T10:00:00.000Z",
        plate: "AB123CD",
        userId: "u1",
        jurisdictionKey: "AR:B",
        violationTypeKey: "velocidad",
      },
      {
        id: "m3",
        occurredAt: "2026-05-03T10:00:00.000Z",
        plate: "AB123CD",
        userId: "u2",
        jurisdictionKey: "AR:B",
        violationTypeKey: "velocidad",
      },
    ];

    const once = runFraudSignalGraphEngine(records);
    const shuffled = runFraudSignalGraphEngine([records[2], records[0], records[1]]);
    assert.deepEqual(
      [...new Set(once.signalsAggregated.map((s) => s.signalType))].sort(),
      [...new Set(shuffled.signalsAggregated.map((s) => s.signalType))].sort()
    );
    assert.ok(once.signalsAggregated.length >= 1);
    const types = new Set(once.signalsAggregated.map((s) => s.signalType));
    assert.ok(types.has("CROSS_JURISDICTION_CHAINING"));
    assert.ok(types.has("SHARED_ENTITY_COLLUSION"));
  });

  it("cada señal incluye reasonCodes y aristas contribuyentes", () => {
    const records = [
      {
        id: "x1",
        occurredAt: "2026-05-01T10:00:00.000Z",
        plate: "ZZ999ZZ",
        userId: "a",
        jurisdictionKey: "AR:J1",
        violationTypeKey: "estacionamiento",
      },
      {
        id: "x2",
        occurredAt: "2026-05-02T10:00:00.000Z",
        plate: "ZZ999ZZ",
        userId: "a",
        jurisdictionKey: "AR:J1",
        violationTypeKey: "estacionamiento",
      },
      {
        id: "x3",
        occurredAt: "2026-05-03T10:00:00.000Z",
        plate: "ZZ999ZZ",
        userId: "a",
        jurisdictionKey: "AR:J1",
        violationTypeKey: "estacionamiento",
      },
    ];
    const out = runFraudSignalGraphEngine(records);
    const hf = out.signalsAggregated.find(
      (s) => s.signalType === "HIGH_FREQUENCY_REPEATS"
    );
    assert.ok(hf);
    assert.ok(Array.isArray(hf.reasonCodes) && hf.reasonCodes.length > 0);
    assert.ok(Array.isArray(hf.contributingEdges));
    assert.ok(Array.isArray(hf.graphPathExplanation));
  });
});
