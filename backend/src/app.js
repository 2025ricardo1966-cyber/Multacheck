/**
 * Express + helmet + CORS + Stripe webhook (raw body) antes de JSON + saneo NoSQL + rutas API.
 */
import { expressErrorHandler } from "@sentry/node";
import { isSentryEnabled } from "./instrument.js";
import "./bootstrap/registerDomainPorts.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { sanitize as sanitizeMongoStructure } from "express-mongo-sanitize";
import billingWebhookRouter from "./billing/webhook.routes.js";
import apiRoutes from "./routes/index.js";
import { webhookLimiter } from "./middleware/rateLimits.js";
import { isSecurityGatewayEnabled } from "./infra/securityGateway/config.js";
import {
  createGatewayBurstLimiter,
  createGatewaySustainedLimiter,
} from "./infra/securityGateway/rateLimiterGateway.js";
import { createSecurityGatewayCoreMiddleware } from "./infra/securityGateway/securityGateway.middleware.js";
import { createTelemetryMiddleware } from "./infra/telemetry/telemetryHttp.middleware.js";
import { globalErrorHandler } from "./middleware/errorHandler.js";

const createApplication =
  typeof express === "function" ? express : express?.default;
if (typeof createApplication !== "function") {
  throw new Error(
    "[MultaCheck] express no expone createApplication (revisá instalación de `express`)."
  );
}

const app = createApplication();

if (String(process.env.MULTACHECK_TRUST_PROXY ?? "").trim() === "1") {
  app.set("trust proxy", 1);
}

/** Cabeceras de seguridad; CSP off en API JSON; CORP cross-origin para CORS con frontend. */
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

const frontendOrigin = process.env.FRONTEND_URL?.trim();

const orchestratorReplayExpose =
  String(process.env.MULTACHECK_ORCHESTRATOR_REPLAY_HEADER ?? "").trim() === "1";

app.use(
  cors({
    origin: frontendOrigin || false,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Stripe-Signature",
      "Idempotency-Key",
      "X-Admin-Debug-Token",
      "X-MultaCheck-Gateway-Key",
      "traceparent",
      "tracestate",
      "X-MultaCheck-Trace-Id",
    ],
    ...(orchestratorReplayExpose
      ? { exposedHeaders: ["X-MultaCheck-Idempotent-Replayed"] }
      : {}),
  })
);

/**
 * Webhook Stripe: raw body obligatorio para verificación HMAC.
 * DEBE ir antes de express.json() para no consumir/mutar el body.
 */
app.use(
  "/api/billing/webhook",
  webhookLimiter,
  express.raw({ type: "application/json" }),
  billingWebhookRouter
);

app.use(express.json({ limit: "1mb" }));
/** Solo body: el middleware integrado asigna req.query/params (solo lectura en Express 5) y rompe el runtime. */
app.use((req, res, next) => {
  try {
    if (req.body != null && typeof req.body === "object") {
      sanitizeMongoStructure(req.body);
    }
  } catch (err) {
    next(err);
    return;
  }
  next();
});

app.use("/api", createTelemetryMiddleware());

if (isSecurityGatewayEnabled()) {
  app.use("/api", createGatewayBurstLimiter());
  app.use("/api", createGatewaySustainedLimiter());
  app.use("/api", createSecurityGatewayCoreMiddleware());
}

app.use("/api", apiRoutes);

if (isSentryEnabled()) {
  app.use(expressErrorHandler());
}

app.use(globalErrorHandler);

export default app;
