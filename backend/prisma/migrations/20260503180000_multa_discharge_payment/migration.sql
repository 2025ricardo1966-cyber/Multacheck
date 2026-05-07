-- AlterTable
ALTER TABLE "Multa" ADD COLUMN     "paid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Multa" ADD COLUMN     "trafficLight" TEXT;
ALTER TABLE "Multa" ADD COLUMN     "dischargeBody" TEXT;
ALTER TABLE "Multa" ADD COLUMN     "stripeCheckoutSessionId" TEXT;

CREATE UNIQUE INDEX "Multa_stripeCheckoutSessionId_key" ON "Multa"("stripeCheckoutSessionId");
