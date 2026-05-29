import { safeTransaction } from "../db/safeTransaction.js";

export function createTenantAndUserForRegister({
  email,
  hashedPassword,
  companyName,
  slug,
}) {
  return safeTransaction(async (tx) => {
    const tier = "FREE";

    const tenant = await tx.tenant.create({
      data: {
        name: companyName,
        slug,
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
        /** Primer usuario del tenant: debe poder operar facturación SaaS (Stripe checkout/portal). */
        role: "admin",
        status: "active",
      },
    });

    return { tenant, user };
  });
}
