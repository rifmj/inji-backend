import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  LoggerService,
} from '@nestjs/common';
import { GraphQLClient } from 'graphql-request';
import { ORDER_CREATE_MUTATION } from '../hooks/graphql/mutations';

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
      const data = await this.client.request(query, variables);
      return data.data;
    } catch (error) {
      throw new HttpException(
        'Ошибка при взаимодействии с Saleor API',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Получает детали заказа из Saleor по его ID.
   * @param orderId ID заказа в Saleor.
   * @returns {Promise<any>} Детали заказа.
   */
  async getOrderDetails(orderId: string): Promise<any> {
    const query = `
      query getOrderDetails($id: ID!) {
        order(id: $id) {
          id
          number
          total {
            gross {
              amount
            }
          }
          user {
            email
          }
          shippingAddress {
            phone
            streetAddress1
            city
            postalCode
          }
          lines {
            productName
            variantName
            quantity
            unitPrice {
              gross {
                amount
              }
            }
            thumbnail {
              url
            }
            variant {
                sku
                product {
                    category {
                        name
                    }
                    attributes {
                        attribute {
                            slug
                        }
                        values {
                            name
                        }
                    }
                }
            }
          }
        }
      }
    `;
    return this.query(query, { id: orderId });
  }

  /**
   * Сохраняет ID заявки AirbaPay в метаданных заказа Saleor.
   * @param orderId ID заказа в Saleor.
   * @param airbaOrderId ID заявки в AirbaPay.
   */
  async updateOrderMetadata(
    orderId: string,
    airbaOrderId: string,
  ): Promise<void> {
    const query = `
      mutation updateMeta($id: ID!, $input: [MetadataInput!]!) {
        updateMetadata(id: $id, input: $input) {
          item {
            metadata {
              key
              value
            }
          }
          errors {
            field
            message
          }
        }
      }
    `;
    await this.query(query, {
      id: orderId,
      input: [{ key: 'airbaPayOrderId', value: airbaOrderId }],
    });
    this.logger.log(
      `Метаданные для заказа Saleor ${orderId} обновлены: airbaPayOrderId=${airbaOrderId}`,
    );
  }

  /**
   * Создает транзакцию (платеж) для заказа в Saleor.
   * @param orderId ID заказа Saleor.
   * @param amount Сумма платежа.
   * @param pspReference Ссылка на транзакцию в платежной системе.
   * @returns {Promise<any>}
   */
  async createPaymentTransaction(
    orderId: string,
    amount: number,
    pspReference: string,
  ): Promise<any> {
    const query = `
      mutation transactionCreate($id: ID!, $transaction: TransactionCreateInput!) {
        transactionCreate(id: $id, transaction: $transaction) {
          transaction {
            id
            pspReference
          }
          errors {
            field
            message
          }
        }
      }
    `;

    return this.query(query, {
      id: orderId,
      transaction: {
        type: 'AUTHORIZATION',
        amount: amount,
        pspReference: pspReference,
        name: 'Airba Pay',
      },
    });
  }

  /**
   * Обновляет приватные метаданные объекта в Saleor.
   * @param objectId GID объекта (заказа).
   * @param key Ключ метаданных.
   * @param value Значение.
   */
  async updatePrivateMetadata(
    objectId: string,
    key: string,
    value: string,
  ): Promise<void> {
    const mutation = `
      mutation updatePrivateMeta($id: ID!, $key: String!, $value: String!) {
        updatePrivateMetadata(id: $id, input: [{key: $key, value: $value}]) {
          item {
            privateMetadata {
              key
              value
            }
          }
          errors {
            field
            message
            code
          }
        }
      }
    `;
    await this.query(mutation, { id: objectId, key, value });
    this.logger.log(
      `Приватные метаданные для ${objectId} обновлены: ${key}=${value}`,
    );
  }

  /**
   * Находит заказы по значению в приватных метаданных.
   * @param key Ключ для поиска.
   * @param value Значение для поиска.
   * @returns {Promise<any>} Найденные заказы.
   */
  async findOrdersByPrivateMetadata(key: string, value: string): Promise<any> {
    const query = `
      query OrdersByMetadata($filter: OrderFilterInput!) {
        orders(first: 1, filter: $filter) {
          edges {
            node {
              id
              number
              status
            }
          }
        }
      }
    `;
    return this.query(query, {
      filter: {
        privateMetadata: [{ key, value }],
      },
    });
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

  /**
   * Отменяет заказ.
   * @param orderId GID заказа.
   */
  async cancelOrder(orderId: string): Promise<any> {
    const mutation = `
      mutation OrderCancel($id: ID!) {
        orderCancel(id: $id) {
          order {
            id
            status
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

  async createOrderFromCheckout(checkoutId: string) {
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
  }
}
