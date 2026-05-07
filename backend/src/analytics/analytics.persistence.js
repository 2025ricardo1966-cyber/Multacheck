import { prisma } from "../config/database.js";
import { AuditAction } from "../audit/audit.model.js";

export function findTenantById(tenantId) {
  return prisma.tenant.findUnique({ where: { id: tenantId } });
}

export function getOverviewCounts(tenantId, since30, since7) {
  return Promise.all([
    prisma.user.count({ where: { tenantId, status: "active" } }),
    prisma.user.count({ where: { tenantId, status: { not: "active" } } }),
    prisma.multa.count({ where: { tenantId } }),
    prisma.auditLog.count({ where: { tenantId, createdAt: { gte: since30 } } }),
    prisma.multa.count({ where: { tenantId, createdAt: { gte: since7 } } }),
    prisma.auditLog.count({
      where: {
        tenantId,
        action: AuditAction.AUTH_LOGIN_SUCCESS,
        createdAt: { gte: since30 },
      },
    }),
    prisma.auditLog.count({
      where: {
        tenantId,
        action: AuditAction.MULTA_ANALYZE_SUCCESS,
        createdAt: { gte: since30 },
      },
    }),
  ]);
}

export function findUsageDailySeries(tenantId) {
  return prisma.usageDaily.findMany({
    where: { tenantId },
    orderBy: { dateKey: "desc" },
    take: 31,
  });
}

export function groupMultasByUser(tenantId) {
  return prisma.multa.groupBy({
    by: ["userId"],
    where: { tenantId },
    _count: { id: true },
  });
}

export function findUsersMetaByIds(ids) {
  return prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, email: true },
  });
}
