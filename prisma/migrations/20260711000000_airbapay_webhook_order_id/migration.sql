-- Persist the Saleor order id created while handling a payment callback, so a
-- retried callback that already created the order (but failed before marking it
-- paid) can resume and pay the existing order instead of re-creating it. The
-- checkout is consumed on order creation (removeCheckout: true), so a naive
-- retry could not recreate it and left the order permanently unpaid.

-- AlterTable
ALTER TABLE "PaymentWebhookEvent" ADD COLUMN "orderId" TEXT;
