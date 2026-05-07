import { prisma } from "../config/database.js";

export function findTenantMembership(userId, tenantId) {
  return prisma.user.findFirst({
    where: {
      id: userId,
      tenantId,
    },
    include: { tenant: true },
  });
}
