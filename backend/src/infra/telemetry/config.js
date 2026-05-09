/**
 * Observabilidad centralizada — opt-in (`MULTACHECK_TELEMETRY=1`).
 * Apagado por defecto: sin overhead ni cambios de comportamiento.
 */

export function isTelemetryEnabled() {
  return String(process.env.MULTACHECK_TELEMETRY ?? "").trim() === "1";
}

export function getTelemetryJsonlPath() {
  const p = process.env.MULTACHECK_TELEMETRY_JSONL_PATH?.trim();
  return p && p.length > 0 ? p : "logs/telemetry-core.jsonl";
}

/** Umbral multiplicador sobre media móvil para marcar `anomaly.latency.spike` (regla fija). */
export function getLatencySpikeMultiplier() {
  const n = Number(process.env.MULTACHECK_TELEMETRY_LATENCY_SPIKE_MULT ?? 5);
  if (!Number.isFinite(n) || n < 2) return 5;
  return Math.min(n, 50);
}

/** Ventana de muestras por clave module|event para media móvil. */
export function getLatencyRollingWindow() {
  const n = Number(process.env.MULTACHECK_TELEMETRY_LATENCY_WINDOW ?? 50);
  if (!Number.isFinite(n) || n < 5) return 50;
  return Math.min(Math.floor(n), 500);
}
