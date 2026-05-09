/**
 * Normalización ligera para trazabilidad (no rompe lecturas estándar de Express).
 * Guarda en req.gateway.normalizedHeaders una vista estable.
 *
 * @param {import('express').Request} req
 */
export function attachNormalizedGatewayHeaders(req) {
  const raw = req.headers ?? {};
  /** @type {Record<string, string>} */
  const normalized = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v !== "string") continue;
    const lk = k.toLowerCase();
    if (
      lk === "authorization" ||
      lk === "cookie" ||
      lk === "stripe-signature"
    ) {
      normalized[lk] = v.length ? "[redacted]" : "";
      continue;
    }
    normalized[lk] = v.trim();
  }
  return normalized;
}
