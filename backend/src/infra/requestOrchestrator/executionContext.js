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
 * Per-request trace for audit / observability (does not alter scoring).
 *
 * @param {{ req: import('express').Request, idempotencyKey: string }} args
 */
export function createAnalyzeOrchestratorContext({ req, idempotencyKey }) {
  const startedAt = Date.now();
  /** @type {{ name: string, detail: string, errorDetail?: string, at: number }[]} */
  const stages = [];

  return {
    requestId:
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : crypto.randomBytes(16).toString("hex"),
    idempotencyKey,
    method: req.method,
    path: req.path ?? req.url?.split("?")[0] ?? "",
    tenantScope: req.auth?.tenantId != null ? String(req.auth.tenantId) : "anonymous",
    userId: req.auth?.userId != null ? String(req.auth.userId) : null,
    /** @type {string | null} */
    requestHash: null,
    stages,
    startedAt,
    /** @type {number | null} */
    endedAt: null,
    /** @type {Record<string, unknown> | null} */
    outcome: null,

    /**
     * @param {string} name
     * @param {string} detail
     * @param {string} [errorDetail]
     */
    stage(name, detail, errorDetail) {
      stages.push({
        name,
        detail,
        ...(errorDetail != null ? { errorDetail } : {}),
        at: Date.now(),
      });
    },

    /** @param {string} h */
    setRequestHash(h) {
      this.requestHash = h;
    },

    /** @param {Record<string, unknown>} o */
    finalize(o) {
      this.endedAt = Date.now();
      this.outcome = o;
    },

    /** Deterministic fingerprint of HTTP outcome for audit rows. */
    outcomeSignature(status, body) {
      return crypto
        .createHash("sha256")
        .update(`${status}:${stableStringify(body)}`)
        .digest("hex");
    },
  };
}
