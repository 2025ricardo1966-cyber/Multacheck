import { getLimitsForTier } from "../plans/plan.service.js";
import {
  countMultasForTenant,
  countMultasForUser,
  findUsageDaily,
  upsertUsageDaily,
} from "./usage.persistence.js";

/** Análisis persistidos con éxito por tenant en plan gratuito (anti-abuso). */
export const FREE_PLAN_TENANT_TOTAL_ANALYZE_CAP = 5;

/** Análisis persistidos con éxito por usuario dentro del tenant en plan gratuito. */
export const FREE_PLAN_USER_ANALYZE_CAP = 3;

function utcDateKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export async function getTodayAnalyzeCountForTenant(tenantId) {
  const dateKey = utcDateKey();
  const row = await findUsageDaily(tenantId, dateKey);
  return row?.analyzeCount ?? 0;
}

export async function incrementAnalyzeUsageForTenant(tenantId) {
  const dateKey = utcDateKey();
  await upsertUsageDaily(tenantId, dateKey);
}

export async function evaluateAnalyzeQuotaForTenant(tenantId, tier) {
  const limits = getLimitsForTier(tier);
  const max = limits.dailyAnalyzeLimit;

  if (max == null) {
    return {
      allowed: true,
      limit: null,
      used: await getTodayAnalyzeCountForTenant(tenantId),
    };
  }

  const used = await getTodayAnalyzeCountForTenant(tenantId);
  return {
    allowed: used < max,
    limit: max,
    used,
  };
}

/**
 * Límites de uso del plan gratuito por volumen total persistido (tabla Multa).
 * No altera la lógica de análisis; solo gobierna si se permite un nuevo intento.
 */
export async function evaluateFreePlanAnalyzeLimits(tenantId, userId, tier) {
  const t = String(tier ?? "free").toLowerCase();
  if (t !== "free") {
    return { allowed: true };
  }

  const tenantTotal = await countMultasForTenant(tenantId);
  if (tenantTotal >= FREE_PLAN_TENANT_TOTAL_ANALYZE_CAP) {
    return {
      allowed: false,
      code: "FREE_TENANT_ANALYZE_LIMIT",
      message: "Tu empresa alcanzó el límite del plan gratuito",
    };
  }

  const userTotal = await countMultasForUser(tenantId, userId);
  if (userTotal >= FREE_PLAN_USER_ANALYZE_CAP) {
    return {
      allowed: false,
      code: "FREE_USER_ANALYZE_LIMIT",
      message: "Has alcanzado tu límite personal dentro del plan gratuito",
    };
  }

  return { allowed: true };
}
