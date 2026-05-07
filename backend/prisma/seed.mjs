import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@multacheck.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "changeme";
  const slug = process.env.SEED_TENANT_SLUG ?? "demo";

  const hash = await bcrypt.hash(password, 12);

  const tenant = await prisma.tenant.upsert({
    where: { slug },
    update: { name: "Empresa demo" },
    create: {
      name: "Empresa demo",
      slug,
      subscriptionTier: "FREE",
      settings: {
        featureFlags: {},
        experiments: {},
        onboarding: { funnelStep: "seeded" },
      },
    },
  });

  await prisma.user.upsert({
    where: {
      tenantId_email: { tenantId: tenant.id, email: email.toLowerCase() },
    },
    update: { password: hash, role: "admin", status: "active" },
    create: {
      tenantId: tenant.id,
      email: email.toLowerCase(),
      password: hash,
      role: "admin",
      status: "active",
    },
  });

  console.log(`Seed OK — tenant: ${slug}, admin: ${email}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
