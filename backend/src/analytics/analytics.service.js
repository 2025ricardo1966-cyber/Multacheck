import { mergeEffectiveFeatureFlags } from "../plans/plan.service.js";
import {
  findTenantById,
  findUsageDailySeries,
  findUsersMetaByIds,
  getOverviewCounts,
  groupMultasByUser,
} from "./analytics.persistence.js";

export async function overviewAnalytics(tenantId) {
  const since30 = new Date(Date.now() - 30 * 86400000);
  const since7 = new Date(Date.now() - 7 * 86400000);

  const tenant = await findTenantById(tenantId);
  if (!tenant) throw new Error("Tenant no encontrado");

  const [
    activeUsers,
    inactiveUsers,
    multasTotal,
    eventsLast30,
    multasLast7,
    loginsLast30,
    analyzesSuccessLast30,
  ] = await getOverviewCounts(tenantId, since30, since7);

  return {
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      subscriptionTier: tenant.subscriptionTier,
      subscriptionStatus: tenant.subscriptionStatus,
    },
    growth: {
      activeUsers,
      inactiveOrSuspendedUsers: inactiveUsers,
      multasTotal,
      auditEventsLast30Days: eventsLast30,
      successfulLoginsLast30Days: loginsLast30,
      analyzesSuccessLast30Days: analyzesSuccessLast30,
      multasLast7Days: multasLast7,
    },
    featureFlags: mergeEffectiveFeatureFlags(tenant),
    onboarding:
      (tenant.settings &&
        typeof tenant.settings === "object" &&
        tenant.settings.onboarding) ||
      {},
  };
}

export async function tenantAnalytics(tenantId) {
  const tenant = await findTenantById(tenantId);
  if (!tenant) throw new Error("Tenant no encontrado");

  return {
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      subscriptionTier: tenant.subscriptionTier,
      subscriptionStatus: tenant.subscriptionStatus,
      subscriptionPeriodEnd: tenant.subscriptionPeriodEnd,
    },
    featureFlags: mergeEffectiveFeatureFlags(tenant),
    experiments:
      (tenant.settings &&
        typeof tenant.settings === "object" &&
        tenant.settings.experiments) ||
      {},
    onboarding:
      (tenant.settings &&
        typeof tenant.settings === "object" &&
        tenant.settings.onboarding) ||
      {},
  };
}

export async function usageAnalytics(tenantId) {
  const series = await findUsageDailySeries(tenantId);

  const byUser = await groupMultasByUser(tenantId);

  const userIds = byUser.map((b) => b.userId);
  const usersMeta =
    userIds.length > 0
      ? await findUsersMetaByIds(userIds)
      : [];
  const emailMap = Object.fromEntries(usersMeta.map((u) => [u.id, u.email]));

  return {
    usageDaily: series,
    multasByUser: byUser.map((row) => ({
      userId: row.userId,
      email: emailMap[row.userId] ?? row.userId,
      multas: row._count.id,
    })),
  };
}
