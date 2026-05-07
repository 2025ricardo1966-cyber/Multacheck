-- AlterTable (nullable first for backfill)
ALTER TABLE "Multa" ADD COLUMN "lifecycleState" TEXT NOT NULL DEFAULT 'ANALYZED';
ALTER TABLE "Multa" ADD COLUMN "idempotencyKey" TEXT;
ALTER TABLE "Multa" ADD COLUMN "requestHash" TEXT;

UPDATE "Multa" SET "requestHash" = md5(random()::text || "id"::text || clock_timestamp()::text)
WHERE "requestHash" IS NULL;

ALTER TABLE "Multa" ALTER COLUMN "requestHash" SET NOT NULL;

UPDATE "Multa" SET "lifecycleState" = 'REPORT_READY'
WHERE "paid" = true AND "paymentStatus" = 'paid';

UPDATE "Multa" SET "lifecycleState" = 'CHECKOUT_CREATED'
WHERE "stripeCheckoutSessionId" IS NOT NULL
  AND NOT ("paid" = true AND "paymentStatus" = 'paid')
  AND "lifecycleState" = 'ANALYZED';

CREATE UNIQUE INDEX "Multa_idempotencyKey_key" ON "Multa"("idempotencyKey") WHERE "idempotencyKey" IS NOT NULL;

CREATE UNIQUE INDEX "Multa_tenant_user_requestHash_key" ON "Multa"("tenantId", "userId", "requestHash");
