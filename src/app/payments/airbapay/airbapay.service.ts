import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AirbapayService {
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
    private configService: ConfigService,
  ) {}

  private getCredentials(): { userId: string; userSecret: string } {
    const creds = this.configService.get<{
      userId?: string;
      userSecret?: string;
    }>('payments.airbapay');
    if (!creds?.userId || !creds?.userSecret) {
      throw new Error('AirbaPay credentials are not configured');
    }
    return { userId: creds.userId, userSecret: creds.userSecret };
  }

  private async authorize() {
    const currentTime = new Date().getTime();

    const tokenExpired =
      !this.tokens?.expiresAt || currentTime >= this.tokens.expiresAt.getTime();

    if (!this.tokens || tokenExpired) {
      const authRequest = await this.httpService
        .post(
          `https://sapi.airbapay.kz/auth/api/v1/authenticate`,
          this.getCredentials(),
        )
        .toPromise();

      if (authRequest?.data?.accessToken) {
        // Expire slightly before the server's own lifetime rather than a fixed
        // 3h guess, so we refresh in time. Fall back to ~3h if expiresIn is
        // missing.
        const expiresInMs = authRequest.data.expiresIn
          ? authRequest.data.expiresIn * 1000
          : 3 * 60 * 60 * 1000;
        this.tokens = {
          accessToken: authRequest.data.accessToken,
          expiresIn: authRequest.data.expiresIn,
          tokenObtainedAt: new Date(),
          expiresAt: new Date(Date.now() + expiresInMs - 60_000),
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
    await this.authorize();
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
            // Set the callback URL server-side (not from the client) and embed
            // our shared secret so AirbaPayCallbackGuard can authenticate the
            // callback that creates the order.
            callbackUrl: this.buildCallbackUrl(),
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
      this.logger.error(
        `AirbaPay pre-create failed: ${JSON.stringify(e?.response?.data)}`,
      );
      return null;
    }
  }

  /** Callback URL registered with AirbaPay, carrying our shared secret. */
  private buildCallbackUrl(): string {
    const origin =
      this.configService.get<{ originHost?: string }>('common')?.originHost ||
      'https://api.store.inji.kz';
    const secret = this.configService.get<string>(
      'payments.airbapay.callbackSecret',
    );
    if (!secret) {
      this.logger.error('AIRBAPAY_CALLBACK_SECRET is not configured');
    }
    return `${origin}/airbapay/payment-callback?token=${encodeURIComponent(
      secret ?? '',
    )}`;
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

  async renderSuccessTemplate(): Promise<string> {
    return this.successTemplate;
  }

  async renderErrorTemplate(): Promise<string> {
    return this.errorTemplate;
  }
}
