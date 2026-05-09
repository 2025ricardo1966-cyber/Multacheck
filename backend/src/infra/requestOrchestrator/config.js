/**
 * Core HTTP orchestrator — opt-in via MULTACHECK_HTTP_ORCHESTRATOR=1.
 * Off by default: identical behavior to pre-orchestrator code paths.
 */

export function isHttpOrchestratorEnabled() {
  return String(process.env.MULTACHECK_HTTP_ORCHESTRATOR ?? "").trim() === "1";
}

/** TTL for cached successful analyze responses (seconds). Default 24h; clamp 1s–7d. */
export function getIdempotencyTtlMs() {
  let sec = Number(process.env.MULTACHECK_IDEMPOTENCY_TTL_SEC ?? 86400);
  if (!Number.isFinite(sec)) sec = 86400;
  sec = Math.min(Math.max(sec, 1), 86400 * 7);
  return Math.floor(sec * 1000);
}

export function isOrchestratorAuditEnabled() {
  return String(process.env.MULTACHECK_ORCHESTRATOR_AUDIT ?? "").trim() === "1";
}

export function getOrchestratorAuditPath() {
  const p = process.env.MULTACHECK_ORCHESTRATOR_AUDIT_PATH?.trim();
  return p && p.length > 0 ? p : "logs/request-orchestrator-audit.jsonl";
}

/** Optional; keeps default HTTP contract unchanged when unset. */
export function isOrchestratorReplayHeaderEnabled() {
  return String(process.env.MULTACHECK_ORCHESTRATOR_REPLAY_HEADER ?? "").trim() === "1";
}
