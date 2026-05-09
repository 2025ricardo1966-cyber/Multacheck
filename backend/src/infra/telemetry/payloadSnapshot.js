import crypto from "node:crypto";

const MAX_STRING = 512;
const MAX_DEPTH = 8;

/**
 * Recorte determinista para huella (sin texto largo ni datos sensibles crudos).
 * @param {unknown} value
 * @param {number} depth
 */
export function redactForSnapshot(value, depth = 0) {
  if (depth > MAX_DEPTH) return "[max_depth]";
  if (value === null || typeof value === "undefined") return value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.length <= MAX_STRING
      ? value
      : `${value.slice(0, MAX_STRING)}…[len=${value.length}]`;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 30).map((x) => redactForSnapshot(x, depth + 1));
  }
  if (typeof value === "object") {
    /** @type {Record<string, unknown>} */
    const out = {};
    const keys = Object.keys(value).sort().slice(0, 40);
    for (const k of keys) {
      const lk = k.toLowerCase();
      if (
        lk.includes("password") ||
        lk.includes("secret") ||
        lk.includes("token") ||
        lk === "authorization"
      ) {
        out[k] = "[redacted]";
        continue;
      }
      out[k] = redactForSnapshot(/** @type {Record<string, unknown>} */ (value)[k], depth + 1);
    }
    return out;
  }
  return String(value);
}

export function stableStringify(value) {
  return JSON.stringify(redactForSnapshot(value));
}

/** SHA-256 hex del snapshot redactado estable. */
export function computePayloadSnapshotHash(payload) {
  return crypto.createHash("sha256").update(stableStringify(payload)).digest("hex");
}
