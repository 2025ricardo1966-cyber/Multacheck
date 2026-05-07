import { prisma } from "../config/database.js";

export function findTenantBySlugPersisted(slug) {
  return prisma.tenant.findUnique({
    where: { slug: slug?.trim().toLowerCase() },
  });
}

export function findTenantByIdPersisted(tenantId) {
  return prisma.tenant.findUnique({ where: { id: tenantId } });
}

export function updateTenantSettingsPersisted(tenantId, settings) {
  return prisma.tenant.update({
    where: { id: tenantId },
    data: { settings },
  });
}
