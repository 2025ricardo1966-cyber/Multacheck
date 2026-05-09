-- Fuente de verdad: caseState (único estado operativo)
ALTER TABLE "Multa" ADD COLUMN "caseState" TEXT NOT NULL DEFAULT 'ANALYZED';

UPDATE "Multa"
SET "caseState" = CASE
  WHEN "lifecycleState" = 'ERROR_STATE' THEN 'FAILED'
  WHEN "dischargeBody" IS NOT NULL AND length(trim("dischargeBody")) > 0 AND "paid" = true THEN 'DISCHARGE_READY'
  WHEN "paid" = true AND coalesce("paymentStatus", '') = 'paid'
       AND ("dischargeBody" IS NULL OR length(trim(coalesce("dischargeBody", ''))) = 0) THEN 'PAID'
  WHEN "lifecycleState" = 'CHECKOUT_CREATED'
       OR ("stripeCheckoutSessionId" IS NOT NULL AND "paid" = false AND coalesce("paymentStatus", '') = 'pending')
    THEN 'PAYMENT_PENDING'
  WHEN "traceAnalyzedAt" IS NOT NULL THEN 'ANALYZED'
  ELSE 'CREATED'
END;

CREATE INDEX "Multa_caseState_idx" ON "Multa"("caseState");
