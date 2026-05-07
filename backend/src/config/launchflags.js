/**
 * Soft launch vs production + feature gates (env-driven).
 * Sin dependencias externas.
 */

function envBool(name, defaultValue) {
  const v = process.env[name]?.trim().toLowerCase();
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return defaultValue;
}

export function getAppMode() {
  const m = process.env.APP_MODE?.trim().toLowerCase();
  return m === "soft_launch" ? "soft_launch" : "production";
}

export function isSoftLaunch() {
  return getAppMode() === "soft_launch";
}

/** Checkout (crear sesión Stripe). En soft_launch por defecto desactivado. */
export function isFeatureCheckoutEnabled() {
  const def = isSoftLaunch() ? false : true;
  return envBool("FEATURE_ENABLE_CHECKOUT", def);
}

/** Persistencia de pago + reporte vía webhook. En soft_launch por defecto desactivado. */
export function isFeatureReportGenerationEnabled() {
  const def = isSoftLaunch() ? false : true;
  return envBool("FEATURE_ENABLE_REPORT_GENERATION", def);
}

export function isVerboseLaunchLogging() {
  return envBool("VERBOSE_LAUNCH_LOGGING", isSoftLaunch());
}

/** Límites de ratio más bajos en soft_launch (ver launchratelimit.js). */
export function isStrictLaunchRateLimits() {
  return isSoftLaunch() || envBool("STRICT_RATE_LIMITS", false);
}
