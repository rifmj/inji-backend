import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { GraphQLClient } from 'graphql-request';
import {
  ORDER_CREATE_MUTATION,
  ORDER_CUSTOMER_KER_ID_QUERY,
  ORDER_UPDATE_METADATA_MUTATION,
} from '../hooks/graphql/mutations';

@Injectable()
export class SaleorService {
  client: GraphQLClient;

  private readonly logger = new Logger(SaleorService.name);

  constructor() {
    this.client = new GraphQLClient(process.env.SALEOR_BACKEND_URL, {
      headers: {
        authorization: `JWT ${process.env.SALEOR_BACKEND_TOKEN}`,
      },
    });
  }

  /**
   * Выполняет GraphQL запрос к Saleor API.
   * @param query GraphQL-запрос.
   * @param variables Переменные для запроса.
   * @returns {Promise<any>} Данные ответа.
   */
  private async query(
    query: string,
    variables: Record<string, any> = {},
  ): Promise<any> {
    try {
      // graphql-request v4 `request()` already returns the unwrapped `data`
      // object (there is no extra `.data` envelope — that is `rawRequest`).
      return await this.client.request(query, variables);
    } catch (error) {
      throw new HttpException(
        'Ошибка при взаимодействии с Saleor API',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Возвращает итоговую сумму (gross) незавершённого checkout в Saleor.
   * Используется как источник истины для суммы кредита/рассрочки в AirbaPay,
   * чтобы не доверять сумме, присланной клиентом.
   *
   * Клиент присылает GID checkout, а этот Saleor принимает в запросе `checkout`
   * только `token` (UUID). GID у Checkout — это base64("Checkout:<token>")
   * (pk = token), поэтому извлекаем токен из GID.
   * @param checkoutId GID checkout (или сам токен).
   * @returns {Promise<number | null>} Сумма в валюте магазина или null, если
   *   checkout не найден / id некорректен.
   */
  async getCheckoutTotal(checkoutId: string): Promise<number | null> {
    const token = this.checkoutTokenFromGid(checkoutId);
    if (!token) {
      this.logger.error(
        `AirbaPay: could not derive checkout token from id "${checkoutId}"`,
      );
      return null;
    }
    const query = `
      query CheckoutTotal($token: UUID!) {
        checkout(token: $token) {
          totalPrice {
            gross {
              amount
            }
          }
        }
      }
    `;
    const data = await this.query(query, { token });
    const amount = data?.checkout?.totalPrice?.gross?.amount;
    return typeof amount === 'number' ? amount : null;
  }

  /**
   * Извлекает токен (UUID) из GID checkout. Saleor GID = base64("Checkout:<pk>"),
   * а pk у Checkout и есть его токен. Если на вход пришёл уже «сырой» токен —
   * возвращаем его как есть.
   */
  private checkoutTokenFromGid(idOrToken: string): string | null {
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!idOrToken) return null;
    if (uuid.test(idOrToken)) return idOrToken;
    try {
      const decoded = Buffer.from(idOrToken, 'base64').toString('utf8');
      const [type, token] = decoded.split(':');
      if (type === 'Checkout' && uuid.test(token)) return token;
    } catch {
      // fall through
    }
    return null;
  }

  /**
   * Возвращает, помечен ли заказ как оплаченный. Используется для
   * идемпотентности: при повторной обработке callback позволяет не помечать
   * оплату второй раз (Saleor вернул бы ошибку на уже оплаченном заказе).
   * @param orderId GID заказа.
   */
  async isOrderPaid(orderId: string): Promise<boolean> {
    const query = `
      query OrderIsPaid($id: ID!) {
        order(id: $id) {
          isPaid
        }
      }
    `;
    const data = await this.query(query, { id: orderId });
    return data?.order?.isPaid === true;
  }

  /**
   * Помечает заказ как оплаченный.
   * @param orderId GID заказа.
   */
  async markOrderAsPaid(orderId: string): Promise<any> {
    const mutation = `
      mutation OrderMarkAsPaid($id: ID!) {
        orderMarkAsPaid(id: $id) {
          order {
            id
            status
            isPaid
          }
          errors {
            field
            message
            code
          }
        }
      }
    `;
    return this.query(mutation, { id: orderId });
  }

  async createOrderFromCheckout(checkoutId: string): Promise<string> {
    const createdOrder = await this.client.request(ORDER_CREATE_MUTATION, {
      id: checkoutId,
    });

    this.logger.log(
      { createdOrder, InvoiceId: checkoutId },
      'Order created from checkout',
    );

    const createdOrderId = createdOrder.orderCreateFromCheckout?.order?.id;
    if (!createdOrderId) {
      throw new Error('Failed to create order: No order ID returned');
    }
    await this.stampCustomerKerId(createdOrderId);
    return createdOrderId;
  }

  /**
   * Копирует идентификатор Keruen из метаданных покупателя в метаданные заказа.
   *
   * Мутация `orderCreateFromCheckout` не принимает metadata, поэтому это
   * отдельный шаг после создания заказа.
   *
   * Best-effort и никогда не бросает: к моменту вызова заказ уже создан, а в
   * карточном потоке деньги уже списаны — падение здесь означало бы повторную
   * обработку callback'а и дубль заказа. Любая ошибка — это лог, а не исключение.
   * @param orderId GID заказа.
   */
  async stampCustomerKerId(orderId: string): Promise<void> {
    try {
      const data = await this.client.request(ORDER_CUSTOMER_KER_ID_QUERY, {
        id: orderId,
      });
      const metadata: { key?: string; value?: string }[] =
        data?.order?.user?.metadata ?? [];
      const kerId = metadata.find((m) => m?.key === 'kerId')?.value;

      if (!kerId) {
        this.logger.warn(
          `Order ${orderId}: customer has no kerId in Saleor metadata, nothing to stamp`,
        );
        return;
      }

      const res = await this.client.request(ORDER_UPDATE_METADATA_MUTATION, {
        id: orderId,
        input: [{ key: 'kerId', value: kerId }],
      });
      // Saleor отдаёт ошибки прав/валидации в payload, а не как GraphQL error.
      const errors = res?.updateMetadata?.errors ?? [];
      if (errors.length) {
        const reason = JSON.stringify(errors);
        this.logger.error(`Order ${orderId}: kerId not stamped: ${reason}`);
        return;
      }
      this.logger.log(`Order ${orderId}: kerId stamped`);
    } catch (error) {
      this.logger.error(
        `Order ${orderId}: failed to stamp kerId: ${(error as Error)?.message}`,
      );
    }
  }
}
