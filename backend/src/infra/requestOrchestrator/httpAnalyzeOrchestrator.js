/**
 * Core HTTP Request Orchestrator — POST /multa/analyze only (controller-wrapped).
 *
 * Logical pipeline when MULTACHECK_HTTP_ORCHESTRATOR=1 and Idempotency-Key is present:
 *
 *   intake_validation → normalization (canonical request hash) → idempotency_lookup
 *     → execution_lock → rule_engine_dispatch + scoring_execution (opaque handler)
 *     → response_assembly → TTL cache
 *
 * With orchestrator OFF or header absent: runs the handler directly (legacy path).
 *
 * Does not import or wrap scoring modules; business stays inside multa flows.
 */

import crypto from "node:crypto";
import { buildAnalyzeRequestHash } from "../../multas/analyzeCanonical.js";
import { runWithConcurrencyLock } from "../../multas/multa.concurrency.js";
import { createAnalyzeOrchestratorContext } from "./executionContext.js";
import { appendAnalyzeOrchestratorAudit } from "./auditTrail.js";
import {
  getIdempotencyTtlMs,
  isHttpOrchestratorEnabled,
  isOrchestratorAuditEnabled,
  isOrchestratorReplayHeaderEnabled,
} from "./config.js";
import { TtlMemoryStore } from "./ttlMemoryStore.js";
import { telemetryEmit } from "../telemetry/telemetryEmit.js";

const store = new TtlMemoryStore();

/** Test helper — clears cached replay payloads only. */
export function __resetHttpOrchestratorForTests() {
  store.clear();
}

/**
 * @param {string} tenantScope
 * @param {string} idempotencyKey
 * @param {string} requestHash
 */
export function buildCompositeCacheKey(tenantScope, idempotencyKey, requestHash) {
  return crypto
    .createHash("sha256")
    .update(`${tenantScope}\n${idempotencyKey}\n${requestHash}`)
    .digest("hex");
}

/**
 * Reads Idempotency-Key header (trimmed). Missing / invalid → null (orchestrator path skipped).
 * @param {import('express').Request} req
 */
export function readAnalyzeIdempotencyKey(req) {
  const raw = req.headers["idempotency-key"];
  if (typeof raw !== "string") return null;
  const key = raw.trim();
  if (!key || key.length > 256) return null;
  return key;
}

/**
 * @typedef {{ kind: 'fresh', status: number, body: unknown }} FreshAnalyzeOutcome
 * @typedef {{ kind: 'replay', status: number, body: unknown }} ReplayAnalyzeOutcome
 */

/**
 * @param {import('express').Request} req
 * @param {() => Promise<unknown>} handler returning analyze JSON body (200 responses)
 * @returns {Promise<FreshAnalyzeOutcome | ReplayAnalyzeOutcome>}
 */
export async function runAnalyzeHttpOrchestration(req, handler) {
  if (!isHttpOrchestratorEnabled()) {
    const body = await handler();
    return { kind: "fresh", status: 200, body };
  }

  const idempotencyKey = readAnalyzeIdempotencyKey(req);
  if (!idempotencyKey) {
    const body = await handler();
    return { kind: "fresh", status: 200, body };
  }

  const ctx = createAnalyzeOrchestratorContext({ req, idempotencyKey });

  ctx.stage("intake_validation", "ok");

  const requestHash = buildAnalyzeRequestHash(req.body ?? {});
  ctx.setRequestHash(requestHash);
  ctx.stage("normalization", "canonical_hash_ok");

  const tenantScope =
    req.auth?.tenantId != null ? String(req.auth.tenantId) : "anonymous";
  const compositeKey = buildCompositeCacheKey(tenantScope, idempotencyKey, requestHash);

  telemetryEmit({
    module_source: "http.orchestrator",
    event_type: "http.orchestrator.enter",
    payload: {
      tenant_scope: tenantScope,
      request_hash_prefix: requestHash.slice(0, 12),
    },
  });

  let cached = store.get(compositeKey);
  ctx.stage("idempotency_lookup", cached ? "cache_hit" : "cache_miss");

  if (cached) {
    telemetryEmit({
      module_source: "http.orchestrator",
      event_type: "http.orchestrator.replay",
      payload: { phase: "pre_lock" },
    });
    ctx.stage("rule_engine_dispatch", "skipped_cached");
    ctx.stage("scoring_execution", "skipped_cached");
    ctx.stage("response_assembly", "replay_pre_lock");
    ctx.finalize({
      replay: true,
      outcomeSignature: ctx.outcomeSignature(cached.status, cached.body),
    });
    await flushOrchestratorAudit(ctx);
    return { kind: "replay", status: cached.status, body: cached.body };
  }

  return await runWithConcurrencyLock(`httpOrch:${compositeKey}`, async () => {
    cached = store.get(compositeKey);
    ctx.stage(
      "idempotency_lookup_post_lock",
      cached ? "cache_hit" : "cache_miss"
    );

    if (cached) {
      telemetryEmit({
        module_source: "http.orchestrator",
        event_type: "http.orchestrator.replay",
        payload: { phase: "post_lock" },
      });
      ctx.stage("rule_engine_dispatch", "skipped_cached");
      ctx.stage("scoring_execution", "skipped_cached");
      ctx.stage("response_assembly", "replay_after_lock");
      ctx.finalize({
        replay: true,
        outcomeSignature: ctx.outcomeSignature(cached.status, cached.body),
      });
      await flushOrchestratorAudit(ctx);
      return { kind: "replay", status: cached.status, body: cached.body };
    }

    ctx.stage("execution_lock", "acquired");
    ctx.stage("rule_engine_dispatch", "enter");
    ctx.stage("scoring_execution", "enter");

    /** @type {unknown} */
    let body;
    try {
      body = await handler();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      telemetryEmit({
        module_source: "http.orchestrator",
        event_type: "http.orchestrator.handler_error",
        severity_level: "error",
        payload: { message: msg.slice(0, 240) },
      });
      ctx.stage("failure_isolation", "handler_error", msg);
      ctx.finalize({
        replay: false,
        stageFailed: "business_dispatch",
        error: msg,
      });
      await flushOrchestratorAudit(ctx);
      throw e;
    }

    ctx.stage("scoring_execution", "ok");
    ctx.stage("rule_engine_dispatch", "ok");

    const status = 200;
    store.set(compositeKey, { status, body }, getIdempotencyTtlMs());

    ctx.stage("response_assembly", "serialized_and_cached");
    ctx.finalize({
      replay: false,
      outcomeSignature: ctx.outcomeSignature(status, body),
    });
    await flushOrchestratorAudit(ctx);

    telemetryEmit({
      module_source: "http.orchestrator",
      event_type: "http.orchestrator.fresh_complete",
      payload: { outcome_signature_prefix: String(ctx.outcome?.outcomeSignature ?? "").slice(0, 16) },
    });

    return { kind: "fresh", status, body };
  });
}

/** @param {ReturnType<typeof createAnalyzeOrchestratorContext>} ctx */
async function flushOrchestratorAudit(ctx) {
  if (!isOrchestratorAuditEnabled()) return;

  const sig =
    ctx.outcome &&
    typeof ctx.outcome === "object" &&
    ctx.outcome !== null &&
    "outcomeSignature" in ctx.outcome &&
    typeof ctx.outcome.outcomeSignature === "string"
      ? ctx.outcome.outcomeSignature
      : null;

  await appendAnalyzeOrchestratorAudit({
    at: new Date().toISOString(),
    requestId: ctx.requestId,
    idempotencyKey: ctx.idempotencyKey,
    requestHash: ctx.requestHash,
    tenantScope: ctx.tenantScope,
    userId: ctx.userId,
    method: ctx.method,
    path: ctx.path,
    executionPath: ctx.stages.map((s) => s.name),
    stages: ctx.stages,
    durationMs: ctx.endedAt != null ? ctx.endedAt - ctx.startedAt : null,
    outcome: ctx.outcome,
    outcomeSignature: sig,
  });
}

/**
 * Optional response header — default off to preserve HTTP surface area.
 * @param {import('express').Response} res
 * @param {{ kind: string }} out
 */
export function maybeSetOrchestratorReplayHeader(res, out) {
  if (out.kind !== "replay") return;
  if (!isOrchestratorReplayHeaderEnabled()) return;
  res.setHeader("X-MultaCheck-Idempotent-Replayed", "true");
}
