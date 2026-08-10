import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../core/shared/logger.service';
import { GraphQLClient } from 'graphql-request';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  GET_CHECKOUT_QUERY,
  ORDER_CREATE_MUTATION,
  TRANSACTION_CREATE_MUTATION,
} from './graphql/mutations';
import { SaleorService } from '../saleor/saleor.service';
import { TelegramService } from '../messaging/telegram/telegram.service';

/** Prisma raises P2002 when a unique constraint (here idempotencyKey) is hit. */
function isUniqueConstraintError(error: unknown): boolean {
  return (error as { code?: string })?.code === 'P2002';
}

@Injectable()
export class PaymentHooksService {
  private client: GraphQLClient;

  constructor(
    private loggerService: LoggerService,
    private prismaService: PrismaService,
    private saleorService: SaleorService,
    private telegramService: TelegramService,
  ) {
    this.client = this.saleorService.client;
  }

  private async updateInvoiceStatus(
    referenceId: string,
    status: number,
  ): Promise<void> {
    try {
      await this.prismaService.invoice.updateMany({
        where: { referenceId },
        data: { status },
      });
    } catch (error) {
      this.loggerService.error(
        { error, referenceId, status },
        'Failed to update invoice status',
      );
      throw error;
    }
  }

  async payPayment(body: {
    InvoiceId: string;
    PaymentAmount: string;
    TransactionId: string;
    AccountId: string;
    Token: string;
    CardLastFour: string;
  }): Promise<boolean> {
    this.loggerService.info(body, 'cloudpayments-pay');

    // Idempotency: TipTopPay retries this callback (timeouts, network hiccups).
    // Claim the payment BEFORE any side effect so a duplicate or concurrent
    // delivery is skipped instead of creating a second order / saved card. Key
    // on the gateway TransactionId; fall back to InvoiceId if it is absent.
    const idempotencyKey = body.TransactionId || body.InvoiceId;
    if (idempotencyKey) {
      try {
        await this.prismaService.paymentWebhookEvent.create({
          data: { provider: 'tiptoppay', idempotencyKey },
        });
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          this.loggerService.info(
            { idempotencyKey, InvoiceId: body.InvoiceId },
            'cloudpayments-pay-duplicate',
          );
          return true;
        }
        throw error;
      }
    } else {
      // No stable key to dedupe on — process, but flag it: retries here could
      // still double up.
      this.loggerService.error(
        { body, status: 'missingIdempotencyKey' },
        'cloudpayments-pay',
      );
    }

    // By the time this "payment succeeded" callback fires, TipTopPay has already
    // captured the money. If order creation then fails we have money with no
    // order — track it so the catch can alert an operator to refund.
    let orderCreated = false;
    try {
      // Create the order FIRST, then persist the card only once the order
      // succeeds — a failed attempt must not leave an orphan saved card.
      const createdOrder = await this.client.request(ORDER_CREATE_MUTATION, {
        id: body.InvoiceId,
      });

      this.loggerService.info(
        { createdOrder, InvoiceId: body.InvoiceId },
        'Order created from checkout',
      );

      const createdOrderId = createdOrder.orderCreateFromCheckout?.order?.id;
      if (!createdOrderId) {
        throw new Error('Failed to create order: No order ID returned');
      }
      orderCreated = true;

      // Stamp the buyer's Keruen id onto the order. Best-effort by design (see
      // SaleorService.stampCustomerKerId) — it must never fail this callback.
      await this.saleorService.stampCustomerKerId(createdOrderId);

      // Record the payment on the order so Saleor shows it as paid. Best-effort:
      // the money is already captured and the order exists, so a failure here is
      // a reconciliation issue to log, not a reason to fail (and retry) the whole
      // callback.
      const orderTotal = createdOrder.orderCreateFromCheckout?.order?.total
        ?.gross as { amount?: number; currency?: string } | undefined;
      await this.recordSaleorPayment(
        createdOrderId,
        body.PaymentAmount,
        body.TransactionId,
        orderTotal,
      );

      // AccountId is the Saleor account email we provisioned for the user.
      // Resolve it back to the local User via the stable saleorEmail handle.
      const user = await this.prismaService.user.findUnique({
        where: { saleorEmail: body.AccountId },
      });

      if (user) {
        // Best-effort: the order already exists and is paid, so a failure to
        // remember the card must not fail (and retry) the whole callback.
        try {
          await this.prismaService.savedCard.create({
            data: {
              userId: user.id,
              cardToken: body.Token,
              cardLastFour: body.CardLastFour,
            },
          });
        } catch (cardError) {
          this.loggerService.error(
            { error: cardError, userId: user.id, status: 'saveCardError' },
            'Failed to save card',
          );
        }
      }

      await this.updateInvoiceStatus(body.InvoiceId, 1);
      await this.markWebhookProcessed(idempotencyKey);
      return true;
    } catch (error) {
      this.loggerService.error(
        {
          error,
          error_response: error?.response,
          error_msg: error?.message,
          status: 'createdOrderError',
          InvoiceId: body.InvoiceId,
        },
        'Failed to process payment',
      );

      // Money is already captured. If the order was never created, this is a
      // "paid but no order" situation — alert an operator to issue a refund.
      if (!orderCreated) {
        await this.alertPaidButNoOrder(body);
      }

      // Release the idempotency claim so a genuine gateway retry can re-run.
      await this.releaseWebhookClaim(idempotencyKey);

      try {
        await this.updateInvoiceStatus(body.InvoiceId, -1);
      } catch (updateError) {
        this.loggerService.error(
          { error: updateError, InvoiceId: body.InvoiceId },
          'Failed to update invoice status to failed',
        );
      }

      return false;
    }
  }

  /**
   * Create a Charged transaction on the order so Saleor reflects the card
   * payment (previously card orders carried no transaction and looked unpaid).
   * Best-effort — logs on failure but does not throw.
   */
  private async recordSaleorPayment(
    orderId: string,
    paymentAmount: string,
    transactionId: string,
    orderTotal?: { amount?: number; currency?: string },
  ): Promise<void> {
    const amount = parseFloat(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      this.loggerService.error(
        { orderId, paymentAmount, status: 'invalidPaymentAmount' },
        'Failed to record Saleor payment',
      );
      return;
    }

    // The charged amount comes from the client-initiated widget; the order total
    // is computed by Saleor. They should match — flag a mismatch for manual
    // reconciliation (don't block: the money is already captured).
    if (
      typeof orderTotal?.amount === 'number' &&
      (orderTotal.currency !== 'KZT' ||
        Math.abs(orderTotal.amount - amount) > 0.5)
    ) {
      this.loggerService.error(
        {
          orderId,
          transactionId,
          charged: amount,
          orderTotal,
          status: 'amountMismatch',
        },
        'Charged amount does not match the Saleor order total',
      );
    }

    try {
      const result = await this.client.request(TRANSACTION_CREATE_MUTATION, {
        id: orderId,
        reference: transactionId,
        amount,
      });
      this.loggerService.info(
        { orderId, transactionId, result },
        'Saleor payment recorded',
      );
    } catch (error) {
      this.loggerService.error(
        { error, orderId, transactionId },
        'Failed to record Saleor payment',
      );
    }
  }

  /**
   * Money captured but the order could not be created — notify an operator so
   * the payment can be refunded manually. Best-effort (never throws).
   */
  private async alertPaidButNoOrder(body: {
    InvoiceId: string;
    PaymentAmount: string;
    TransactionId: string;
  }): Promise<void> {
    try {
      await this.telegramService.sendMessage(
        `⚠️ Оплата прошла, но заказ НЕ создан — требуется возврат.\n` +
          `TransactionId: ${body.TransactionId}\n` +
          `Checkout: ${body.InvoiceId}\n` +
          `Сумма: ${body.PaymentAmount}`,
      );
    } catch (error) {
      this.loggerService.error(
        { error, InvoiceId: body.InvoiceId, status: 'paidNoOrderAlertFailed' },
        'Failed to send paid-but-no-order alert',
      );
    }
  }

  /** Mark a claimed webhook as fully processed (best-effort). */
  private async markWebhookProcessed(idempotencyKey?: string): Promise<void> {
    if (!idempotencyKey) return;
    try {
      await this.prismaService.paymentWebhookEvent.update({
        where: { idempotencyKey },
        data: { status: 'processed' },
      });
    } catch (error) {
      this.loggerService.error(
        { error, idempotencyKey },
        'Failed to mark payment webhook processed',
      );
    }
  }

  /**
   * Drop the idempotency claim after a failed attempt so a later gateway retry
   * is allowed to re-run instead of being skipped as a duplicate (best-effort).
   */
  private async releaseWebhookClaim(idempotencyKey?: string): Promise<void> {
    if (!idempotencyKey) return;
    try {
      await this.prismaService.paymentWebhookEvent.deleteMany({
        where: { idempotencyKey },
      });
    } catch (error) {
      this.loggerService.error(
        { error, idempotencyKey },
        'Failed to release payment webhook claim',
      );
    }
  }

  failPayment(body: any) {
    this.loggerService.info(body, 'cloudpayments-fail');
    return {
      code: 0,
    };
  }

  cancelPayment(body: any) {
    this.loggerService.info(body, 'cloudpayments-cancel');
    return {
      code: 0,
    };
  }

  async checkPayment(body: any) {
    this.loggerService.info(body, 'cloudpayments-check');
    console.info('cloudpayments-check', body);
    try {
      const getInvoiceById = await this.client.request(GET_CHECKOUT_QUERY, {
        id: body.InvoiceId,
      });
      this.loggerService.info({ getInvoiceById, body }, 'cloudpayments-check');
      console.info('cloudpayments-check-1', { getInvoiceById, body });
    } catch (e) {
      this.loggerService.info({ error: e, body }, 'cloudpayments-check');
      console.info('cloudpayments-check-2-error', { error: e, body });
    }
    return {
      code: 0,
    };
  }

  confirmPayment(body: any) {
    this.loggerService.info(body, 'cloudpayments-confirm');
    return {
      code: 0,
    };
  }

  refundPayment(body: any) {
    this.loggerService.info(body, 'cloudpayments-refund');
    return {
      code: 0,
    };
  }
}
