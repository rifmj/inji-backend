import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../core/shared/logger.service';
import { TelegramService } from '../messaging/telegram/telegram.service';
import { GraphQLClient } from 'graphql-request';
import { PushService } from '../messaging/push/push.service';
import {
  OrderCreatedHook,
  OrderUpdatedHook,
  OrderLine,
  OrderAddress,
  OrderFulfilledHook,
  OrderFulfillmentLine,
} from './types/OrderHooks';

@Injectable()
export class OrderHooksService {
  private client: GraphQLClient;

  constructor(
    private readonly loggerService: LoggerService,
    private readonly telegramService: TelegramService,
    private readonly pushService: PushService,
    private readonly configService: ConfigService,
  ) {}

  setGraphQLClient(client: GraphQLClient) {
    this.client = client;
  }

  // Base URL for the courier order-control panel (GET /push/control/:orderId,
  // served by this backend). Override with ORIGIN_HOST; defaults to the current
  // public host. Previously hardcoded to the decommissioned core.inji.kz.
  private orderControlUrl(orderId: string | number): string {
    const origin =
      this.configService.get<{ originHost?: string }>('common')?.originHost ||
      'https://api.store.inji.kz';
    return `${origin}/push/control/${orderId}`;
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
      \nУправление - ${this.orderControlUrl(order.id)}
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
    fulfillmentsLines: OrderFulfillmentLine[],
  ): Promise<void> {
    try {
      const lines = fulfillmentsLines
        .map((line) => [line.product_name, line.quantity].join(' - '))
        .join('\n');
      await this.telegramService.sendMessage(
        `Заказ собран: ${orderId}. Товары: ${lines}`,
      );
    } catch (e) {
      this.loggerService.error(
        { error: e, status: 'telegramSendError' },
        'saleor-order-fulfilled',
      );
    }
  }

  // Payment is recorded in Saleor at pay time (PaymentHooksService.payPayment
  // creates a Charged transaction), so fulfillment only notifies the customer
  // and the ops channel. The old TipTopPay two-stage confirm here was dead code:
  // card orders never carried a Saleor transaction to confirm.
  async handleOrderFulfilled(body: OrderFulfilledHook[]): Promise<null> {
    const order = body[0];
    const orderId = order.id;

    await this.sendPushNotification(order.meta.issuing_principal.id);
    await this.sendTelegramNotification(
      orderId,
      order.fulfillments[0]?.lines || [],
    );

    this.loggerService.info({ ...body }, 'saleor-order-fulfilled');
    return null;
  }
} 