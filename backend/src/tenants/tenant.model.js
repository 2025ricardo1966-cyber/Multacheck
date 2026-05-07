/**
 * Shape esperado en Tenant.settings (JSON). Sin runtime validation pesado — extensible.
 *
 * @typedef {Object} TenantSettings
 * @property {Record<string, boolean>} [featureFlags]
 * @property {Record<string, unknown>} [experiments]
 * @property {Record<string, unknown>} [onboarding]
 */

export const DEFAULT_TENANT_SETTINGS = Object.freeze({
  featureFlags: {},
  experiments: {},
  onboarding: { funnelStep: "registered" },
});
