import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as fs from 'fs';
import * as path from 'path';

import * as jwt from 'jsonwebtoken';
import { PaymentService } from './payment.service';
import { UpdateOrderStatusByBrokerDto } from './airba-pay.dto';
import { SaleorService } from '../../saleor/saleor.service';
import { SaleorSyncService } from '../../saleor/saleor-sync.service';

@Injectable()
export class AirbapayService {
  credentials = {
    userId: '7a40e94f-f688-4f5a-a9fa-20e471164ed0',

    userSecret: 'rkVYH9R2HRdlKwYQ6GfsmKBNl2NMQK2w',
  };

  private readonly logger = new Logger(AirbapayService.name);

  tokens?: {
    accessToken: string;
    expiresIn: number;
    expiresAt?: Date;
    tokenObtainedAt?: Date;
    tokenType: 'bearer';
  };

  private readonly successTemplate = `<!DOCTYPE html>
<html>
  <head>
    <title>Payment Successful</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
        background-color: #f0f0f0;
      }
      .container {
        text-align: center;
        padding: 2rem;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .success-icon {
        color: #4CAF50;
        font-size: 48px;
        margin-bottom: 1rem;
      }
      h1 {
        color: #4CAF50;
        margin-bottom: 1rem;
      }
      p {
        color: #666;
        margin-bottom: 1rem;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="success-icon">✓</div>
      <h1>Payment Successful</h1>
      <p>Your payment has been processed successfully.</p>
      <p>Thank you for your business!</p>
    </div>
  </body>
</html>`;

  private readonly errorTemplate = `<!DOCTYPE html>
<html>
  <head>
    <title>Payment Error</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
        background-color: #f0f0f0;
      }
      .container {
        text-align: center;
        padding: 2rem;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .error-icon {
        color: #f44336;
        font-size: 48px;
        margin-bottom: 1rem;
      }
      h1 {
        color: #f44336;
        margin-bottom: 1rem;
      }
      p {
        color: #666;
        margin-bottom: 1rem;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="error-icon">✕</div>
      <h1>Payment Error</h1>
      <p>There was an error processing your payment.</p>
      <p>Please try again or contact support if the problem persists.</p>
    </div>
  </body>
</html>`;

  constructor(
    private httpService: HttpService,
    private paymentService: PaymentService,
    private saleorSyncService: SaleorSyncService,
  ) {}

  private async authorize() {
    const THREE_HOURS = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
    const currentTime = new Date().getTime();

    const tokenExpired =
      !this.tokens?.expiresAt || currentTime >= this.tokens.expiresAt.getTime();

    if (!this.tokens || tokenExpired) {
      const authRequest = await this.httpService
        .post(
          `https://sapi.airbapay.kz/auth/api/v1/authenticate`,
          this.credentials,
        )
        .toPromise();

      if (authRequest?.data?.accessToken) {
        this.tokens = {
          accessToken: authRequest.data.accessToken,
          expiresIn: authRequest.data.expiresIn,
          tokenObtainedAt: new Date(),
          expiresAt: new Date(Date.now() + THREE_HOURS),
          tokenType: 'bearer',
        };
      }
    }
  }

  public async preCreateOrder(body: {
    address: {
      /**
       * Адрес доставки
       * Required
       */
      delivery: string;
      /**
       * Адрес самовывоза
       * Required
       */
      pickupPoint: string;
    };
    /**
     * url сервиса update-merchant-order-state на стороне партнера
     * Required
     */
    callbackUrl: string;
    /**
     * Номер телефона клиента
     * 10 цифр,  без +7, без дефисов или скобок
     * формат: 7771234567
     * Required
     */
    mobile: string;
    channel: 'web' | 'mob' | 'android' | 'ios';
    /**
     * url для возврата клиента на сторону магазина при неудачном исходе сценария
     */
    failureBackUrl: string;
    goods: {
      /**
       * Required
       */
      brand: string;
      /**
       * Required
       */
      category: string;
      image: string;
      /**
       * Наименование магазина (можно указать код партнера в кредитном брокере который предостовляет команда Airba)
       * merchant
       * merchant_online
       * Required
       */
      merchantName: string;
      /**
       * Наименование товара
       */
      model: string;
      price: number;
      quantity: number;
      sku: string;
    }[];
    isDelivery: boolean;
    loanLength: number;

    /**
     * Номер заказа в магазине. Ее следует делать читабельным для людей по типу TGT612 или 1005
     * Required
     */
    orderId: string;
    /**
     * Список финансовых партнеров в которые необходимо сформировать заявку.
     * Ее нужно получить по хендлеру order/payment-partners
     * Required
     */
    paymentPartners: [
      {
        code: 'airba';
        name: 'Airba';
      },
    ];
    productType: 'loan' | 'installment';
    /**
     * Код партнера в системе AirbaPay (предоставляется командой AirbaPay)
     * Required
     */
    salesCode: string;
    /**
     * Почтовый индекс места доставки или самовывоза. Достаточно индекса города старого образца (для Алматы 050000)
     * Required
     */
    salesPlace: string;
    /**
     * url для возврата клиента на сторону магазина при удачном исходе сценария
     * Required
     */
    successBackUrl: string;
    /**
     * Общая цена заказа
     * Required
     */
    totalCost: number;

    customer: {
      contact: {
        mobile: string;
      };
    };
  }) {
    console.info('Starting auth');
    await this.authorize();
    console.info('Stopping auth');
    try {
      const paymentPartners = await this.getPaymentPartners();
      const preCreateOrderRequest = await this.httpService
        .post<{
          orderId: string;
          redirectUrl: string;
        }>(
          `https://sapi.airbapay.kz/bg-proxy-general/api/v1/order/pre-create`,
          {
            ...body,
            paymentPartners,
          },
          {
            headers: {
              Authorization: `Bearer ${this.tokens.accessToken}`,
            },
          },
        )
        .toPromise();
      return preCreateOrderRequest.data;
    } catch (e) {
      console.info('error', e?.response?.data);
      return null;
    }
  }

  public async getPaymentPartners() {
    await this.authorize();
    const paymentPartnersGet = await this.httpService
      .get<
        {
          code: string;
          logo: string;
          name: string;
        }[]
      >(
        `https://sapi.airbapay.kz/bg-proxy-general/api/v1/order/payment-partners`,
        {
          headers: {
            Authorization: `Bearer ${this.tokens.accessToken}`,
          },
        },
      )
      .toPromise();
    return paymentPartnersGet.data;
  }

  private readonly predefinedUsername = 'airba-broker';
  private readonly predefinedPassword = 'password123'; // используйте более безопасный пароль на практике

  private readonly secretKey = 'your_secret_key'; // секретный ключ для подписи токенов

  async authenticate(username: string, password: string): Promise<string> {
    // Проверка логина и пароля
    if (
      username !== this.predefinedUsername ||
      password !== this.predefinedPassword
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Генерация JWT
    const token = jwt.sign({ username }, this.secretKey, { expiresIn: '1h' });
    return `Bearer ${token}`;
  }

  async updateMerchantOrderState(
    body: any,
    token: string,
  ): Promise<{ message: string }> {
    const isValid = this.validateToken(token);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Логика для обновления состояния заказа
    return { message: 'Заявка успешно обновлена' };
  }

  /**
   * Обрабатывает обновление статуса от AirbaPay и синхронизирует его с Saleor.
   * @param statusUpdate - Данные о статусе от брокера.
   */
  async handleStatusUpdate(
    statusUpdate: UpdateOrderStatusByBrokerDto,
  ): Promise<void> {
    // ID из callback'а теперь рассматривается как ID заявки в AirbaPay,
    // который мы ранее сохранили в метаданных заказа Saleor.
    const { orderId: airbaPayOrderId, state } = statusUpdate;
    this.logger.log(
      `Получен статус '${state}' для заявки AirbaPay ID: '${airbaPayOrderId}'`,
    );

    try {
      switch (state) {
        case 'confirmed':
        case 'completed':
          await this.saleorSyncService.handleSuccessfulPayment(airbaPayOrderId);
          break;

        case 'rejected':
        case 'customer_cancelled':
        case 'merchant_cancelled':
          await this.saleorSyncService.handleFailedPayment(airbaPayOrderId);
          break;

        case 'refunded':
          this.logger.log(
            `Статус 'refunded' для заявки ${airbaPayOrderId}. Требуется ручная обработка.`,
          );
          // Здесь можно добавить логику для создания возврата в Saleor.
          break;

        default:
          this.logger.warn(
            `Получен необрабатываемый статус '${state}' для заявки ${airbaPayOrderId}`,
          );
      }
    } catch (error) {
      this.logger.error(
        `Ошибка при обработке статуса для заявки AirbaPay ID ${airbaPayOrderId}:`,
        error.message,
      );
      // Важно обработать ошибку, чтобы AirbaPay не пытался отправить callback повторно.
      // В зависимости от ответа вашего API, можно вернуть код, который остановит повторные попытки.
    }
  }

  private validateToken(token: string): boolean {
    try {
      const decoded = jwt.verify(token.split(' ')[1], this.secretKey);
      return !!decoded;
    } catch (e) {
      return false; // токен недействителен
    }
  }

  async renderSuccessTemplate(): Promise<string> {
    return this.successTemplate;
  }

  async renderErrorTemplate(): Promise<string> {
    return this.errorTemplate;
  }

  async validateCallback(
    body: {
      orderId: string;
      status: 'success' | 'error';
      transactionId?: string;
      errorMessage?: string;
    },
    authHeader: string,
  ): Promise<boolean> {
    try {
      // Validate the authorization header
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
      }

      // Validate the token
      const isValidToken = this.validateToken(authHeader);
      if (!isValidToken) {
        return false;
      }

      // Validate the callback data
      if (!body.orderId || !body.status) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating callback:', error);
      return false;
    }
  }

  async processPaymentCallback(body: {
    orderId: string;
    status: 'success' | 'error';
    transactionId?: string;
    errorMessage?: string;
  }) {
    try {
      // Log the callback for debugging
      console.log('Processing payment callback:', body);

      // Update payment status in the database
      const payment = await this.paymentService.findById(body.orderId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Update payment status based on callback
      if (body.status === 'success') {
        return await this.paymentService.confirm({
          id: payment.id,
          transactionId: body.transactionId,
        });
      } else {
        return await this.paymentService.cancel({
          id: payment.id,
        });
      }
    } catch (error) {
      console.error('Error processing payment callback:', error);
      throw error;
    }
  }
}
