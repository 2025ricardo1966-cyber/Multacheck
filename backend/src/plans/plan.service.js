import {
  PLAN_KEYS,
  PLAN_LIMITS,
  PLAN_METADATA,
  PLAN_PRICING,
  PLAN_FEATURES,
  FEATURE_FLAGS_BY_TIER,
  getStripePriceIdForTier,
} from "./plan.config.js";

/** Maps DB enum (FREE, PRO, ENTERPRISE) and other casings to plan.config.js keys. */
function tierConfigKey(tier) {
  const t = String(tier == null ? "free" : tier).toLowerCase();
  if (t === "enterprise") return "enterprise";
  if (t === "pro") return "pro";
  return "free";
}

export function getLimitsForTier(tier) {
  const key = tierConfigKey(tier);
  return PLAN_LIMITS[key];
}

export function isPaidTier(tier) {
  const k = tierConfigKey(tier);
  return k === "pro" || k === "enterprise";
}

export function mergeEffectiveFeatureFlags(tenant) {
  const tier = tierConfigKey(tenant?.subscriptionTier);
  const base = FEATURE_FLAGS_BY_TIER[tier] || FEATURE_FLAGS_BY_TIER.free;
  const custom =
    (tenant?.settings &&
      typeof tenant.settings === "object" &&
      tenant.settings.featureFlags) ||
    {};
  return { ...base, ...custom };
}

export function listPublicPlans() {
  return PLAN_KEYS.map((key) => ({
    id: key,
    name: PLAN_METADATA[key]?.label ?? key,
    priceUsd: PLAN_PRICING[key]?.priceUsd ?? 0,
    dailyQuota: PLAN_LIMITS[key]?.dailyAnalyzeLimit ?? null,
    features: PLAN_FEATURES[key] ?? [],
    key,
    ...(PLAN_METADATA[key] || {}),
    limits: PLAN_LIMITS[key],
    stripePriceConfigured: Boolean(getStripePriceIdForTier(key)),
  }));
}
