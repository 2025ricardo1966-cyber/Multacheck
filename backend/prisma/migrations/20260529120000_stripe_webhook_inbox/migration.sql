-- CreateTable
CREATE TABLE "StripeWebhookInbox" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "StripeWebhookInbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StripeWebhookInbox_status_idx" ON "StripeWebhookInbox"("status");

-- CreateIndex
CREATE INDEX "StripeWebhookInbox_receivedAt_idx" ON "StripeWebhookInbox"("receivedAt");
