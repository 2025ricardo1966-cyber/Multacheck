import crypto from "node:crypto";
import { isTelemetryEnabled } from "./config.js";
import { telemetryStorage, resolveTraceId } from "./telemetryContext.js";
import { telemetryEmit } from "./telemetryEmit.js";

/**
 * ALS + correlación por petición bajo `/api`.
 * Emite `http.request.completed` en `finish` (solo observación).
 */
export function createTelemetryMiddleware() {
  return function telemetryMiddleware(req, res, next) {
    if (!isTelemetryEnabled()) {
      next();
      return;
    }

    const requestId = crypto.randomUUID();
    const traceId = resolveTraceId(req) ?? requestId;
    const spanId = crypto.randomBytes(8).toString("hex");

    const store = {
      requestId,
      traceId,
      spanId,
      startedAt: Date.now(),
      method: req.method ?? "GET",
      path: req.path ?? "",
    };

    req.telemetryContext = store;

    telemetryStorage.run(store, () => {
      res.on("finish", () => {
        telemetryEmit({
          module_source: "http.edge",
          event_type: "http.request.completed",
          severity_level: "info",
          payload: {
            method: store.method,
            path: store.path,
            status_code: res.statusCode,
            duration_ms: Date.now() - store.startedAt,
          },
        });
      });

      next();
    });
  };
}
