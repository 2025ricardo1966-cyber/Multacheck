import { prisma } from "../config/database.js";

export function updateTenantStripeCustomerId(tenantId, stripeCustomerId) {
  return prisma.tenant.update({
    where: { id: tenantId },
    data: { stripeCustomerId },
  });
}

export function findTenantByStripeCustomerId(stripeCustomerId) {
  return prisma.tenant.findFirst({
    where: { stripeCustomerId },
  });
}

export function updateTenantSubscriptionState(tenantId, data) {
  return prisma.tenant.update({
    where: { id: tenantId },
    data,
  });
}
