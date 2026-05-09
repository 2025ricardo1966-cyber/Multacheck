/**
 * Identidad canónica del body de analyze — **solo utilidades puras** (sin DB ni infra).
 * Compartido por persistencia (@@unique requestHash) y orquestador HTTP (clave idempotencia).
 */
import crypto from "node:crypto";

/**
 * Canonical payload for hashing only. Optional keys omitted when absent.
 * resultJson is intentionally excluded from identity (FINAL DECISION B).
 * @param {Record<string, unknown>|null|undefined} body
 */
export function canonicalizeAnalyzeBody(body) {
  const canonical = {
    country: String(body?.country ?? "AR"),
    type: String(body?.type ?? "transito"),
    description: String(body?.description ?? "").trim(),
  };
  if (body?.rawInput != null) canonical.rawInput = body.rawInput;
  if (body?.label != null) canonical.label = body.label;
  if (body?.trafficLight != null) canonical.trafficLight = body.trafficLight;
  return canonical;
}

/** requestHash = SHA-256 of canonical business body (chaos + @@unique). */
export function buildAnalyzeRequestHash(body) {
  const canonical = canonicalizeAnalyzeBody(body);
  return crypto.createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}
