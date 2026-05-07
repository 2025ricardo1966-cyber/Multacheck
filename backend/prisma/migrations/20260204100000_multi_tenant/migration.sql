-- Multi-tenant: Tenant como contenedor; billing y uso a nivel empresa.

CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'suspended');

CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'free',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" TEXT,
    "subscriptionPeriodEnd" TIMESTAMP(3),
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
CREATE UNIQUE INDEX "Tenant_stripeCustomerId_key" ON "Tenant"("stripeCustomerId");
CREATE UNIQUE INDEX "Tenant_stripeSubscriptionId_key" ON "Tenant"("stripeSubscriptionId");

ALTER TABLE "User" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "User" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'active';

DO $$
DECLARE r RECORD;
DECLARE tid TEXT;
DECLARE s TEXT;
BEGIN
  FOR r IN SELECT * FROM "User" LOOP
    tid := gen_random_uuid()::text;
    s := 'org-' || substring(md5(random()::text || r.id::text) from 1 for 12);
    INSERT INTO "Tenant" ("id","name","slug","subscriptionTier","stripeCustomerId","stripeSubscriptionId","subscriptionStatus","subscriptionPeriodEnd","settings","createdAt","updatedAt")
    VALUES (
      tid,
      COALESCE(NULLIF(trim(split_part(r.email, '@', 2)), ''), 'Mi empresa'),
      s,
      COALESCE(r."subscriptionTier", 'free'::"SubscriptionTier"),
      r."stripeCustomerId",
      r."stripeSubscriptionId",
      r."subscriptionStatus",
      r."subscriptionPeriodEnd",
      '{}',
      r."createdAt",
      r."updatedAt"
    );
    UPDATE "User" SET "tenantId" = tid WHERE id = r.id;
  END LOOP;
END $$;

DROP INDEX IF EXISTS "User_email_key";

ALTER TABLE "User" ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "Multa" ADD COLUMN "tenantId" TEXT;

UPDATE "Multa" m SET "tenantId" = u."tenantId" FROM "User" u WHERE m."userId" = u.id;

ALTER TABLE "Multa" ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "AuditLog" ADD COLUMN "tenantId" TEXT;

UPDATE "AuditLog" a SET "tenantId" = u."tenantId" FROM "User" u WHERE a."userId" = u.id;

DROP TABLE IF EXISTS "UsageDaily";

CREATE TABLE "UsageDaily" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "analyzeCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UsageDaily_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UsageDaily_tenantId_dateKey_key" ON "UsageDaily"("tenantId", "dateKey");
CREATE INDEX "UsageDaily_tenantId_idx" ON "UsageDaily"("tenantId");

ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");

ALTER TABLE "Multa" ADD CONSTRAINT "Multa_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Multa_tenantId_idx" ON "Multa"("tenantId");

ALTER TABLE "UsageDaily" ADD CONSTRAINT "UsageDaily_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");

ALTER TABLE "User" DROP COLUMN "stripeCustomerId";
ALTER TABLE "User" DROP COLUMN "stripeSubscriptionId";
ALTER TABLE "User" DROP COLUMN "subscriptionTier";
ALTER TABLE "User" DROP COLUMN "subscriptionStatus";
ALTER TABLE "User" DROP COLUMN "subscriptionPeriodEnd";
