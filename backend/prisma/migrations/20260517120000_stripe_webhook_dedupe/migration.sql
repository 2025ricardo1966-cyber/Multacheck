CREATE TABLE "ProcessedStripeWebhookEvent" (
  "id" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProcessedStripeWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProcessedStripeWebhookEvent_receivedAt_idx" ON "ProcessedStripeWebhookEvent" ("receivedAt");
