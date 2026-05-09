import prisma from "../db/prisma.js";
import {
  getAppMode,
  isFeatureCheckoutEnabled,
  isFeatureReportGenerationEnabled,
  isVerboseLaunchLogging,
} from "../config/launchflags.js";
import { getOperationalState } from "../infra/launchhealth.js";
import { getStripeCircuitSnapshot } from "../infra/stripecircuitbreaker.js";
import { APP_NAME, APP_VERSION } from "../config/version.js";
import { webhookQueue } from "../billing/webhookQueue.js";

/** Ruta HTTP donde Stripe envía eventos (sin secretos). */
export const STRIPE_WEBHOOK_HTTP_PATH = "/api/billing/webhook";

export async function getHealth(_req, res) {
  const checks = {
    server: "ok",
    database: "unknown",
    stripe: "unknown",
    ai: "unknown",
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch (_e) {
    checks.database = "error";
  }

  checks.stripe = process.env.STRIPE_SECRET_KEY?.trim()
    ? "configured"
    : "missing";

  if (
    String(process.env.AI_PROVIDER || "").trim().toLowerCase() === "openai"
  ) {
    checks.ai = process.env.OPENAI_API_KEY?.trim() ? "configured" : "missing";
  } else {
    checks.ai = "javascript";
  }

  const version =
    process.env.npm_package_version?.trim() || APP_VERSION;

  const signingSecretConfigured = Boolean(
    process.env.STRIPE_WEBHOOK_SECRET?.trim()
  );
  const stripeSdkConfigured = Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  /** HTTP puede ACK con firma válida aunque falte STRIPE_SECRET_KEY; el worker async puede fallar/reintentar. */
  const webhookReadiness = signingSecretConfigured
    ? stripeSdkConfigured
      ? "ready"
      : "partial"
    : "misconfigured";

  let queueStats = { pending: 0, processing: false, oldestPendingMs: 0 };
  try {
    queueStats = webhookQueue.getStats();
  } catch (_e) {
    /* no bloquear health si la cola fallara */
  }

  /** DB ok ⇒ healthy para smoke/E2E; integraciones opcionales en `checks`. */
  const httpStatus = checks.database === "error" ? 503 : 200;
  const overall =
    checks.database === "error" ? "unhealthy" : "healthy";

  res.status(httpStatus).json({
    ok: overall === "healthy",
    status: overall,
    checks,
    stripeWebhook: {
      path: STRIPE_WEBHOOK_HTTP_PATH,
      signingSecretConfigured,
      stripeSdkConfigured,
      readiness: webhookReadiness,
      queue: queueStats,
    },
    timestamp: new Date().toISOString(),
    version,
    service: APP_NAME,
    uptime: process.uptime(),
  });
}

export function getVersion(_req, res) {
  res.json({
    name: APP_NAME,
    version: APP_VERSION,
  });
}

/** Requiere cabecera X-Admin-Debug-Token (mismo esquema que /admin). */
export function getLaunchOperations(_req, res) {
  const ops = getOperationalState();
  res.json({
    appMode: getAppMode(),
    features: {
      enableCheckout: isFeatureCheckoutEnabled(),
      enableReportGeneration: isFeatureReportGenerationEnabled(),
    },
    logging: { verboseLaunch: isVerboseLaunchLogging() },
    operationalState: ops.state,
    incidents: ops.incidents,
    stripeCheckoutCircuit: getStripeCircuitSnapshot(),
  });
}
