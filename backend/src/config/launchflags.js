/**
 * Soft launch vs production + feature gates (env-driven).
 * Checkout e informes post-pago requieren APP_MODE=production.
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

function envBool(name, defaultValue) {
  const v = process.env[name]?.trim().toLowerCase();
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return defaultValue;
}

export function getAppMode() {
  const m = process.env.APP_MODE?.trim().toLowerCase();
  if (m === "soft_launch") return "soft_launch";
  if (m === "production") return "production";
  return "production";
}

export function isSoftLaunch() {
  return getAppMode() === "soft_launch";
}

function isProductionAppMode() {
  return getAppMode() === "production";
}

/** Checkout (crear sesión Stripe). Solo con APP_MODE=production (override: FEATURE_ENABLE_CHECKOUT). */
export function isFeatureCheckoutEnabled() {
  if (!isProductionAppMode()) return false;
  return envBool("FEATURE_ENABLE_CHECKOUT", true);
}

/** Persistencia de pago + reporte vía webhook. Solo con APP_MODE=production. */
export function isFeatureReportGenerationEnabled() {
  if (!isProductionAppMode()) return false;
  return envBool("FEATURE_ENABLE_REPORT_GENERATION", true);
}

/** Booleanos para health/scripts (`APP_MODE=production` en entorno). */
export const FEATURE_ENABLE_CHECKOUT = isFeatureCheckoutEnabled();
export const FEATURE_ENABLE_REPORT_GENERATION =
  isFeatureReportGenerationEnabled();

export function isVerboseLaunchLogging() {
  return envBool("VERBOSE_LAUNCH_LOGGING", isSoftLaunch());
}

/** Límites de ratio más bajos en soft_launch (ver launchratelimit.js). */
export function isStrictLaunchRateLimits() {
  return isSoftLaunch() || envBool("STRICT_RATE_LIMITS", false);
}
