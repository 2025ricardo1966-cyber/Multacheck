import prisma from "../db/prisma.js";
import { safeTransaction } from "../db/safeTransaction.js";

export function createTenantAndUserForRegister({ email, hashedPassword }) {
  return safeTransaction(async (tx) => {
    const tier = "FREE";

    const tenant = await tx.tenant.create({
      data: {
        name: `Tenant ${Date.now()}`,
        slug: `tenant-${Date.now()}`,
        subscriptionTier: tier,
        settings: {
          featureFlags: {},
          experiments: {},
          onboarding: {
            funnelStep: "registered",
          },
        },
      },
    });

    const user = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        tenantId: tenant.id,
        status: "active",
      },
    });

    return { tenant, user };
  });
}
