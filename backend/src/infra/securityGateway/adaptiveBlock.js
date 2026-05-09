import {
  getAdaptiveViolationThreshold,
  getAdaptiveScanWindowMs,
  getAdaptiveBlockDurationMs,
} from "./config.js";

/** @type {Map<string, { n: number, resetAt: number }>} */
const violations = new Map();

/** @type {Map<string, number>} ip -> unblock timestamp */
const blockedUntil = new Map();

export function isAdaptivelyBlocked(ip) {
  const until = blockedUntil.get(ip);
  if (until == null) return false;
  if (Date.now() > until) {
    blockedUntil.delete(ip);
    return false;
  }
  return true;
}

/**
 * Cuenta incidentes de seguridad por IP en ventana deslizante; superado el umbral → bloqueo temporal.
 * @param {string} ip
 */
export function recordSecurityViolations(ip, count = 1) {
  const now = Date.now();
  const windowMs = getAdaptiveScanWindowMs();
  const threshold = getAdaptiveViolationThreshold();
  const blockMs = getAdaptiveBlockDurationMs();

  let row = violations.get(ip);
  if (!row || now > row.resetAt) {
    row = { n: 0, resetAt: now + windowMs };
  }
  row.n += count;
  violations.set(ip, row);

  if (row.n >= threshold) {
    blockedUntil.set(ip, now + blockMs);
    violations.delete(ip);
  }
}

/** Solo tests — limpia estado en proceso. */
export function __resetAdaptiveBlockForTests() {
  violations.clear();
  blockedUntil.clear();
}
