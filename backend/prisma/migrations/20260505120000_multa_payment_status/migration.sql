-- AlterTable
ALTER TABLE "Multa" ADD COLUMN "paymentStatus" TEXT;
ALTER TABLE "Multa" ADD COLUMN "stripePaymentIntentId" TEXT;

UPDATE "Multa" SET "paymentStatus" = 'paid' WHERE "paid" = true AND "paymentStatus" IS NULL;
