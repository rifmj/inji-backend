-- Idempotency guard for TipTopPay payment webhooks (/hooks/payments/pay).
-- The gateway retries callbacks; this table lets us process each payment once.

-- CreateTable
CREATE TABLE "PaymentWebhookEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processing',

    CONSTRAINT "PaymentWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentWebhookEvent_idempotencyKey_key" ON "PaymentWebhookEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PaymentWebhookEvent_idempotencyKey_idx" ON "PaymentWebhookEvent"("idempotencyKey");
