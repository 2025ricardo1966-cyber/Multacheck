import {
  getAppMode,
  isFeatureCheckoutEnabled,
  isFeatureReportGenerationEnabled,
  isVerboseLaunchLogging,
} from "../config/launchflags.js";
import { getOperationalState } from "../infra/launchhealth.js";
import { getStripeCircuitSnapshot } from "../infra/stripecircuitbreaker.js";
import { APP_NAME, APP_VERSION } from "../config/version.js";

export function getHealth(_req, res) {
  res.json({
    ok: true,
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
