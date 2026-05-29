import * as usageService from "./usage.service.js";
import { logAudit } from "../audit/audit.service.js";
import { AuditAction } from "../audit/audit.model.js";

export async function checkFreePlanAnalyzeLimits(req, res, next) {
  try {
    const tenant = req.tenant;
    if (!tenant?.id) {
      return res.status(500).json({ error: "Tenant no resuelto" });
    }

    const evaluation = await usageService.evaluateFreePlanAnalyzeLimits(
      tenant.id,
      req.auth.userId,
      tenant.subscriptionTier
    );

    if (!evaluation.allowed) {
      await logAudit({
        tenantId: tenant.id,
        userId: req.auth.userId,
        action: AuditAction.USAGE_LIMIT_EXCEEDED,
        metadata: {
          resource: "multa.analyze",
          limitKind: evaluation.code,
          tier: tenant.subscriptionTier,
        },
        ip: req.ip,
        headers: req.headers,
      });
      return res.status(429).json({
        error: evaluation.message,
        code: evaluation.code,
      });
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Cuota diaria por plan (solo requests autenticados con tenant resuelto).
 * Los anónimos no pasan por aquí.
 */
export async function checkAnalyzeQuota(req, res, next) {
  try {
    const tenant = req.tenant;
    if (!tenant?.id) {
      return res.status(500).json({ error: "Tenant no resuelto" });
    }

    const tier = tenant.subscriptionTier ?? "FREE";
    const { allowed, limit, used } =
      await usageService.evaluateAnalyzeQuotaForTenant(tenant.id, tier);

    if (!allowed) {
      await logAudit({
        tenantId: tenant.id,
        userId: req.auth.userId,
        action: AuditAction.USAGE_LIMIT_EXCEEDED,
        metadata: { tier, limit, used, resource: "multa.analyze" },
        ip: req.ip,
        headers: req.headers,
      });
      return res.status(429).json({
        error: "Límite diario alcanzado para el plan de tu empresa",
        code: "USAGE_LIMIT",
        limit,
        used,
      });
    }

    next();
  } catch (err) {
    next(err);
  }
}

/** Alias para políticas SaaS (cuota por tenant según plan). */
export const checkPlanLimits = checkAnalyzeQuota;

/** Cuota diaria por plan si hay JWT; anónimos siguen sin límite de tenant (solo rate limit). */
export async function enforceAuthenticatedAnalyzeQuota(req, res, next) {
  if (!req.auth) {
    return next();
  }
  return checkAnalyzeQuota(req, res, next);
}
