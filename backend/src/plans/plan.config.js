/**
 * Fuente única de definición de planes (límites y copy público).
 * Los price IDs de Stripe vienen de variables de entorno.
 */

export const PLAN_KEYS = Object.freeze(["free", "pro", "enterprise"]);

export const PLAN_LIMITS = Object.freeze({
  free: {
    dailyAnalyzeLimit: 5,
  },
  pro: {
    dailyAnalyzeLimit: 100,
  },
  enterprise: {
    dailyAnalyzeLimit: null,
  },
});

/** Defaults por plan (merge con Tenant.settings.featureFlags). */
export const FEATURE_FLAGS_BY_TIER = Object.freeze({
  free: {
    beta_features: false,
    advanced_reports: false,
    export_data: false,
  },
  pro: {
    beta_features: false,
    advanced_reports: true,
    export_data: true,
  },
  enterprise: {
    beta_features: true,
    advanced_reports: true,
    export_data: true,
  },
});

export const PLAN_METADATA = Object.freeze({
  free: {
    label: "Free",
    description: "Acceso básico con límites estrictos.",
  },
  pro: {
    label: "Pro",
    description: "Mayor volumen de análisis para usuarios activos.",
  },
  enterprise: {
    label: "Enterprise",
    description: "Análisis ilimitados y capacidad máxima.",
  },
});

export const PLAN_PRICING = Object.freeze({
  free: { priceUsd: 0 },
  pro: { priceUsd: 9.99 },
  enterprise: { priceUsd: 99 },
});

export const PLAN_FEATURES = Object.freeze({
  free: ["basic_analyze", "daily_quota"],
  pro: ["advanced_reports", "export_data", "higher_daily_quota"],
  enterprise: [
    "beta_features",
    "advanced_reports",
    "export_data",
    "unlimited_analyze",
  ],
});

/** Price IDs de Stripe (Dashboard → Products → Price API ID) */
export function getStripePriceIdForTier(tier) {
  const t = String(tier).toLowerCase();
  if (t === "pro") return process.env.STRIPE_PRICE_PRO?.trim() || null;
  if (t === "enterprise") return process.env.STRIPE_PRICE_ENTERPRISE?.trim() || null;
  return null;
}

export function getTierForStripePriceId(priceId) {
  if (!priceId) return null;
  const pro = process.env.STRIPE_PRICE_PRO?.trim();
  const ent = process.env.STRIPE_PRICE_ENTERPRISE?.trim();
  if (pro && priceId === pro) return "pro";
  if (ent && priceId === ent) return "enterprise";
  return null;
}
