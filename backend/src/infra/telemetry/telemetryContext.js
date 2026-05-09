import { AsyncLocalStorage } from "node:async_hooks";

/** @typedef {{ requestId: string, traceId: string, spanId: string, startedAt: number, method: string, path: string }} TelemetryStore */

export const telemetryStorage = new AsyncLocalStorage();

/** @returns {TelemetryStore | undefined} */
export function getTelemetryStore() {
  return telemetryStorage.getStore();
}

/**
 * traceparent: 00-{trace-id}-{parent-id}-{flags}
 * @param {string | undefined} header
 */
export function parseTraceParentTraceId(header) {
  if (typeof header !== "string") return null;
  const parts = header.trim().split("-");
  if (parts.length < 4) return null;
  const traceId = parts[1];
  if (!/^[0-9a-f]{32}$/i.test(traceId)) return null;
  return traceId.toLowerCase();
}

/**
 * @param {import('express').Request} req
 */
export function resolveTraceId(req) {
  const tp = parseTraceParentTraceId(req.headers?.traceparent);
  if (tp) return tp;
  const xt = req.headers?.["x-multacheck-trace-id"];
  if (typeof xt === "string" && xt.trim()) {
    const t = xt.trim().slice(0, 128);
    if (/^[a-zA-Z0-9._:-]+$/.test(t)) return t;
  }
  return null;
}
