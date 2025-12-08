import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../core/shared/logger.service';
import { TelegramService } from '../messaging/telegram/telegram.service';
import { HttpService } from '@nestjs/axios';
import { GraphQLClient } from 'graphql-request';
import { PushService } from '../messaging/push/push.service';
import {
  OrderCreatedHook,
  OrderUpdatedHook,
  OrderLine,
  OrderAddress,
  OrderFulfilledHook,
  OrderTransactionsResponse,
  TipTopPayResponse,
  OrderFulfillmentLine,
} from './types/OrderHooks';
import {
  GET_ORDER_TRANSACTIONS_QUERY,
  TRANSACTION_UPDATE_MUTATION,
} from './graphql/mutations';

@Injectable()
export class OrderHooksService {
  private client: GraphQLClient;

  constructor(
    private readonly loggerService: LoggerService,
    private readonly telegramService: TelegramService,
    private readonly httpService: HttpService,
    private readonly pushService: PushService,
  ) {}

  setGraphQLClient(client: GraphQLClient) {
    this.client = client;
  }

  private formatOrderLines(lines: OrderLine[]): string {
    return lines
      .map((line) => [line.product_name, line.quantity].join(' - '))
      .join(';\n');
  }

  private formatAddress(address: OrderAddress): string {
    if (!address) return 'N/A';
    const parts = [
      address.streetAddress1,
      address.streetAddress2,
      address.city,
      address.postalCode,
      address.country?.country,
    ].filter(Boolean);
    return parts.join(', ');
  }

  private async sendOrderCreatedNotifications(
    order: OrderCreatedHook,
    formattedLines: string,
  ): Promise<void> {
    const message = `Заказ создан: на сумму ${order.total_net_amount} 
      \n email: ${order.user_email}
      \nТовары в заказе: ${formattedLines}. 
      \nОбщий вес - ${order.weight}
      \nУправление - https://core.inji.kz/push/control/${order.id}
      \nАдрес доставки: ${this.formatAddress(order.billing_address)}`;

    await this.telegramService.sendMessage(message);
    await this.telegramService.sendMessage(message, '@inji_uralsk_delivery');
  }

  async handleOrderCreated(body: OrderCreatedHook[]): Promise<{ ok: boolean }> {
    this.loggerService.info(body, 'saleor-order-created');
    const order = body[0];
    const formattedLines = this.formatOrderLines(order.lines);

    await this.sendOrderCreatedNotifications(order, formattedLines);
    return { ok: true };
  }

  private getOrderContext(status: string): string {
    return status === 'draft'
      ? 'draft-saleor-order-updated'
      : 'saleor-order-updated';
  }

  async handleOrderUpdated(
    body: OrderUpdatedHook[],
    headers: any,
  ): Promise<null> {
    const status = body[0].status;
    const ctx = this.getOrderContext(status);

    if (status === 'fulfilled') {
      // Handle fulfilled status if needed
    }

    this.loggerService.info(
      {
        ...body,
        headers,
      },
      ctx,
    );
    return null;
  }

  private async handleOrderTransactions(orderId: string): Promise<{
    txId: string | null;
    reference: number | null;
    amount: number | null;
  }> {
    let orderTransactions: OrderTransactionsResponse | null = null;

    try {
      orderTransactions = await this.client.request<OrderTransactionsResponse>(
        GET_ORDER_TRANSACTIONS_QUERY,
        { id: orderId },
      );
    } catch (e) {
      this.loggerService.error(e, 'Failed to fetch order transactions');
      return { txId: null, reference: null, amount: null };
    }

    if (orderTransactions?.order?.transactions?.length > 1) {
      return { txId: null, reference: null, amount: null };
    }

    const transaction = orderTransactions?.order?.transactions?.[0];
    if (!transaction) {
      return { txId: null, reference: null, amount: null };
    }

    return {
      txId: transaction.id,
      reference: parseInt(transaction.reference),
      amount: parseFloat(transaction.authorizedAmount.amount),
    };
  }

  private async confirmPaymentWithTipTopPay(
    reference: number,
    amount: number,
  ): Promise<TipTopPayResponse | null> {
    try {
      return await this.httpService
        .post<TipTopPayResponse>(
          'https://api.tiptoppay.kz/payments/confirm',
          {
            TransactionId: reference,
            Amount: amount,
          },
          {
            auth: {
              username: 'pk_fd7484ae803dd00e66a1a919f3b86',
              password: '845091bf6d206d2a31fddb1d5c71561f',
            },
          },
        )
        .toPromise();
    } catch (e) {
      this.loggerService.error(e, 'Failed to confirm payment with TipTopPay');
      return null;
    }
  }

  private async updateTransactionStatus(
    txId: string,
    reference: number,
    amount: number,
  ): Promise<void> {
    try {
      const transactionUpdate = await this.client.request(
        TRANSACTION_UPDATE_MUTATION,
        { id: txId, reference, amount },
      );

      this.loggerService.info({ transactionUpdate }, 'saleor-order-fulfilled');
    } catch (e) {
      this.loggerService.error(
        { error: e, status: 'transactionUpdateError' },
        'saleor-order-fulfilled',
      );
    }
  }

  private async sendPushNotification(userId: string): Promise<void> {
    try {
      await this.pushService.sendToUser(userId, {
        notification: {
          title: 'Ура!',
          body: 'Ваш заказ собран и скоро будет у вас',
        },
      });
    } catch (e) {
      this.loggerService.error(
        { error: e, status: 'pushError' },
        'saleor-order-fulfilled',
      );
    }
  }

  private async sendTelegramNotification(
    orderId: string,
    amount: number,
    fulfillmentsLines: OrderFulfillmentLine[],
  ): Promise<void> {
    try {
      const lines = fulfillmentsLines
        .map((line) => [line.product_name, line.quantity].join(' - '))
        .join('\n');
      await this.telegramService.sendMessage(
        `Заказ собран: ${orderId} на сумму ${amount}}. Товары: ${lines}`,
      );
    } catch (e) {
      this.loggerService.error(
        { error: e, status: 'telegramSendError' },
        'saleor-order-fulfilled',
      );
    }
  }

  async handleOrderFulfilled(body: OrderFulfilledHook[]): Promise<null> {
    const order = body[0];
    const orderId = order.id;

    // Handle order transactions
    const { txId, reference, amount } = await this.handleOrderTransactions(orderId);
    if (!txId || !reference || !amount) {
      return null;
    }

    // Confirm payment with TipTopPay
    const createTxResult = await this.confirmPaymentWithTipTopPay(reference, amount);

    // Update transaction status
    await this.updateTransactionStatus(txId, reference, amount);

    // Send notifications
    await this.sendPushNotification(order.meta.issuing_principal.id);
    await this.sendTelegramNotification(
      orderId,
      amount,
      order.fulfillments[0].lines || [],
    );

    this.loggerService.info(
      { ...body, createTxResult: createTxResult?.data },
      'saleor-order-fulfilled',
    );
    return null;
  }
} 