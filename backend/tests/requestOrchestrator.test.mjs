import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import {
  runAnalyzeHttpOrchestration,
  __resetHttpOrchestratorForTests,
  buildCompositeCacheKey,
} from "../src/infra/requestOrchestrator/httpAnalyzeOrchestrator.js";

function baseReq(body = { description: "test", country: "AR", type: "transito" }) {
  return {
    method: "POST",
    path: "/multa/analyze",
    headers: {},
    body,
    auth: null,
  };
}

describe("requestOrchestrator (HTTP analyze)", () => {
  beforeEach(() => {
    __resetHttpOrchestratorForTests();
    delete process.env.MULTACHECK_HTTP_ORCHESTRATOR;
    delete process.env.MULTACHECK_IDEMPOTENCY_TTL_SEC;
    delete process.env.MULTACHECK_ORCHESTRATOR_AUDIT;
  });

  afterEach(() => {
    __resetHttpOrchestratorForTests();
    delete process.env.MULTACHECK_HTTP_ORCHESTRATOR;
    delete process.env.MULTACHECK_IDEMPOTENCY_TTL_SEC;
  });

  it("sin flag: no deduplica aunque haya Idempotency-Key", async () => {
    let calls = 0;
    const handler = async () => {
      calls++;
      return { n: calls };
    };
    const req = baseReq();
    req.headers["idempotency-key"] = "abc";
    const a = await runAnalyzeHttpOrchestration(req, handler);
    const b = await runAnalyzeHttpOrchestration(req, handler);
    assert.equal(calls, 2);
    assert.equal(a.kind, "fresh");
    assert.equal(b.kind, "fresh");
  });

  it("con flag + header: misma petición → handler una vez y segundo replay", async () => {
    process.env.MULTACHECK_HTTP_ORCHESTRATOR = "1";
    let calls = 0;
    const handler = async () => {
      calls++;
      return { token: "one" };
    };
    const req = baseReq();
    req.headers["idempotency-key"] = "idem-1";
    const first = await runAnalyzeHttpOrchestration(req, handler);
    const second = await runAnalyzeHttpOrchestration(req, handler);
    assert.equal(calls, 1);
    assert.equal(first.kind, "fresh");
    assert.equal(second.kind, "replay");
    assert.deepEqual(second.body, first.body);
  });

  it("mismo header distinto body → dos ejecuciones", async () => {
    process.env.MULTACHECK_HTTP_ORCHESTRATOR = "1";
    let calls = 0;
    const handler = async () => {
      calls++;
      return { calls };
    };
    const r1 = baseReq({ description: "a", country: "AR", type: "transito" });
    r1.headers["idempotency-key"] = "shared";
    const r2 = baseReq({ description: "b", country: "AR", type: "transito" });
    r2.headers["idempotency-key"] = "shared";
    await runAnalyzeHttpOrchestration(r1, handler);
    await runAnalyzeHttpOrchestration(r2, handler);
    assert.equal(calls, 2);
  });

  it("concurrencia: segundo request espera y obtiene replay", async () => {
    process.env.MULTACHECK_HTTP_ORCHESTRATOR = "1";
    let calls = 0;
    const handler = async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 40));
      return { ok: true };
    };
    const req = baseReq();
    req.headers["idempotency-key"] = "parallel";
    const [outA, outB] = await Promise.all([
      runAnalyzeHttpOrchestration(req, handler),
      runAnalyzeHttpOrchestration(req, handler),
    ]);
    assert.equal(calls, 1);
    const kinds = new Set([outA.kind, outB.kind]);
    assert.ok(kinds.has("fresh"));
    assert.ok(kinds.has("replay"));
  });

  it("TTL corto: tras espera se vuelve a ejecutar", async () => {
    process.env.MULTACHECK_HTTP_ORCHESTRATOR = "1";
    process.env.MULTACHECK_IDEMPOTENCY_TTL_SEC = "1";
    let calls = 0;
    const handler = async () => {
      calls++;
      return { v: calls };
    };
    const req = baseReq();
    req.headers["idempotency-key"] = "ttl-key";
    await runAnalyzeHttpOrchestration(req, handler);
    await runAnalyzeHttpOrchestration(req, handler);
    assert.equal(calls, 1);
    await new Promise((r) => setTimeout(r, 1150));
    await runAnalyzeHttpOrchestration(req, handler);
    assert.equal(calls, 2);
  });

  it("buildCompositeCacheKey es estable", () => {
    const k = buildCompositeCacheKey("t1", "ik", "hh");
    assert.match(k, /^[a-f0-9]{64}$/);
    assert.equal(k, buildCompositeCacheKey("t1", "ik", "hh"));
    assert.notEqual(k, buildCompositeCacheKey("t2", "ik", "hh"));
  });
});
