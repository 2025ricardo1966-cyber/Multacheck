import crypto from "node:crypto";

function stableStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
}

/**
 * Hash estable para comparar respuestas JSON entre corridas (replay).
 * Texto no-JSON se hashea tal cual.
 */
export function hashHttpBody(text) {
  const raw = String(text ?? "");
  try {
    const parsed = JSON.parse(raw);
    return crypto
      .createHash("sha256")
      .update(stableStringify(parsed))
      .digest("hex");
  } catch {
    return crypto.createHash("sha256").update(raw).digest("hex");
  }
}

/**
 * Health incluye timestamp/uptime/cola que cambian entre requests; se sacan solo para comparar replay.
 */
export function hashHealthBodyForReplay(text) {
  const raw = String(text ?? "");
  try {
    const parsed = JSON.parse(raw);
    const stable = { ...parsed };
    delete stable.timestamp;
    delete stable.uptime;
    if (stable.stripeWebhook && typeof stable.stripeWebhook === "object") {
      const sw = { ...stable.stripeWebhook };
      delete sw.queue;
      stable.stripeWebhook = sw;
    }
    return crypto
      .createHash("sha256")
      .update(stableStringify(stable))
      .digest("hex");
  } catch {
    return hashHttpBody(text);
  }
}

/** Elige función de hash según path (replay estable). */
export function hashReplayResponse(path, text) {
  const p = String(path ?? "");
  if (p.endsWith("/health") || p.includes("/health?")) {
    return hashHealthBodyForReplay(text);
  }
  return hashHttpBody(text);
}
