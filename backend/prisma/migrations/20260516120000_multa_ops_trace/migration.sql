-- Lifecycle trace timestamps + ops event log (observability only)

ALTER TABLE "Multa" ADD COLUMN "traceCreatedAt" TIMESTAMP(3);
ALTER TABLE "Multa" ADD COLUMN "traceAnalyzedAt" TIMESTAMP(3);
ALTER TABLE "Multa" ADD COLUMN "traceCheckoutAt" TIMESTAMP(3);
ALTER TABLE "Multa" ADD COLUMN "tracePaidAt" TIMESTAMP(3);
ALTER TABLE "Multa" ADD COLUMN "traceReportAt" TIMESTAMP(3);

UPDATE "Multa"
SET
  "traceCreatedAt" = "createdAt",
  "traceAnalyzedAt" = "createdAt"
WHERE "traceCreatedAt" IS NULL OR "traceAnalyzedAt" IS NULL;

UPDATE "Multa"
SET "traceCheckoutAt" = "updatedAt"
WHERE "stripeCheckoutSessionId" IS NOT NULL
  AND "lifecycleState" IN ('CHECKOUT_CREATED', 'PAID_CONFIRMED', 'REPORT_READY')
  AND "traceCheckoutAt" IS NULL;

UPDATE "Multa"
SET
  "tracePaidAt" = "updatedAt",
  "traceReportAt" = "updatedAt"
WHERE "paid" = true
  AND "tracePaidAt" IS NULL;

CREATE TABLE "MultaOpsEvent" (
  "id" TEXT NOT NULL,
  "multaId" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "payload" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MultaOpsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MultaOpsEvent_multaId_idx" ON "MultaOpsEvent" ("multaId");
CREATE INDEX "MultaOpsEvent_event_idx" ON "MultaOpsEvent" ("event");
CREATE INDEX "MultaOpsEvent_createdAt_idx" ON "MultaOpsEvent" ("createdAt");

ALTER TABLE "MultaOpsEvent"
  ADD CONSTRAINT "MultaOpsEvent_multaId_fkey"
  FOREIGN KEY ("multaId") REFERENCES "Multa" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
