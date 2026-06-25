-- Kaspi invoice outbox: lets the phone-automation worker (kaspi-automation
-- --watch) poll pending invoices, send them via the Kaspi Business app, and
-- report back. Kaspi has no API and no paid-callback, so this tracks the SEND
-- only (status), not payment.

-- AlterTable
ALTER TABLE "KaspiPaymentRequest" ADD COLUMN     "orderNumber" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "error" TEXT;

-- Backfill: rows that predate this feature must NOT be auto-sent. Mark them
-- terminal ('skipped'); only rows created AFTER this migration get the 'pending'
-- column default and are picked up by the worker. Remove/adjust this UPDATE only
-- if you deliberately want the worker to process the historical backlog.
UPDATE "KaspiPaymentRequest" SET "status" = 'skipped';

-- CreateIndex
CREATE INDEX "KaspiPaymentRequest_status_idx" ON "KaspiPaymentRequest"("status");
