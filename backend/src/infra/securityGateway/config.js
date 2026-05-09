/**
 * Security Gateway — perímetro HTTP opcional (MULTACHECK_SECURITY_GATEWAY=1).
 * Apagado por defecto: sin cambios de comportamiento.
 */

export function isSecurityGatewayEnabled() {
  return String(process.env.MULTACHECK_SECURITY_GATEWAY ?? "").trim() === "1";
}

export function isGatewayAuditEnabled() {
  return String(process.env.MULTACHECK_GATEWAY_AUDIT ?? "").trim() === "1";
}

export function getGatewayAuditPath() {
  const p = process.env.MULTACHECK_GATEWAY_AUDIT_PATH?.trim();
  return p && p.length > 0 ? p : "logs/security-gateway-audit.jsonl";
}

/** Lista explícita de prefijos permitidos bajo /api (solo si esta env está activa). */
export function isGatewayRouteAllowlistEnabled() {
  return String(process.env.MULTACHECK_GATEWAY_ROUTE_ALLOWLIST ?? "").trim() === "1";
}

/** Bloqueo adaptativo tras N flags de seguridad en adaptiveScanWindowMs. */
export function getAdaptiveViolationThreshold() {
  const n = Number(process.env.MULTACHECK_GATEWAY_ADAPTIVE_THRESHOLD ?? 5);
  if (!Number.isFinite(n) || n < 2) return 5;
  return Math.min(Math.floor(n), 50);
}

export function getAdaptiveScanWindowMs() {
  const n = Number(process.env.MULTACHECK_GATEWAY_ADAPTIVE_WINDOW_MS ?? 900000);
  if (!Number.isFinite(n) || n < 60_000) return 900_000;
  return Math.min(Math.floor(n), 86_400_000);
}

export function getAdaptiveBlockDurationMs() {
  const n = Number(process.env.MULTACHECK_GATEWAY_ADAPTIVE_BLOCK_MS ?? 900000);
  if (!Number.isFinite(n) || n < 30_000) return 900_000;
  return Math.min(Math.floor(n), 24 * 60 * 60 * 1000);
}
