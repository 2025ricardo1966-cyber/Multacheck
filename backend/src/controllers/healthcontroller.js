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

  const allOk = Object.values(checks).every(
    (v) => v === "ok" || v === "configured" || v === "javascript"
  );

  const version =
    process.env.npm_package_version?.trim() || APP_VERSION;

  res.status(allOk ? 200 : 503).json({
    status: allOk ? "healthy" : "degraded",
    checks,
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
