import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SaleorService } from '../saleor/saleor.service';
import { ConfigService } from '@nestjs/config';
import {
  CreatePreOrderDto,
  GoodDto,
  PaymentPartnerDto,
} from '../payments/airbapay/airba-pay.dto';
import { AirbaService } from '../payments/airbapay/airba.service';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly airbaPayService: AirbaService,
    private readonly saleorService: SaleorService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Создает платежную сессию в AirbaPay для существующего заказа Saleor.
   * @param saleorOrderId ID заказа в Saleor.
   * @returns {Promise<{redirectUrl: string}>} Ссылка для редиректа на оплату.
   */
  async createAirbaPayment(
    saleorOrderId: string,
  ): Promise<{ redirectUrl: string }> {
    this.logger.log(
      `Инициация платежа AirbaPay для заказа Saleor: ${saleorOrderId}`,
    );

    // 1. Получаем детали заказа из Saleor
    const { order } = await this.saleorService.getOrderDetails(saleorOrderId);
    if (!order) {
      throw new NotFoundException(
        `Заказ с ID ${saleorOrderId} не найден в Saleor.`,
      );
    }

    // 2. Получаем список доступных фин. партнеров от Airba
    const paymentPartners: PaymentPartnerDto[] =
      await this.airbaPayService.getPaymentPartners();
    if (!paymentPartners || paymentPartners.length === 0) {
      throw new Error(
        'Не удалось получить список финансовых партнеров от AirbaPay.',
      );
    }

    // 3. Формируем DTO для AirbaPay на основе данных заказа
    const preOrderDto = this.mapSaleorOrderToAirbaDto(order, paymentPartners);

    // 4. Создаем предзаявку в AirbaPay
    const airbaResponse = await this.airbaPayService.createPreOrder(
      preOrderDto,
    );
    const airbaOrderId = airbaResponse.orderId;

    // 5. Сохраняем ID заявки AirbaPay в метаданных заказа Saleor для будущей синхронизации
    await this.saleorService.updateOrderMetadata(saleorOrderId, airbaOrderId);

    this.logger.log(
      `Заявка ${airbaOrderId} успешно создана в AirbaPay для заказа Saleor ${saleorOrderId}.`,
    );

    return { redirectUrl: airbaResponse.redirectUrl };
  }

  /**
   * Маппит данные заказа Saleor в DTO для AirbaPay.
   * @param order Заказ из Saleor.
   * @param paymentPartners Список фин. партнеров.
   * @returns {CreatePreOrderDto}
   */
  private mapSaleorOrderToAirbaDto(
    order: any,
    paymentPartners: PaymentPartnerDto[],
  ): CreatePreOrderDto {
    const goods: GoodDto[] = order.lines.map((line) => {
      // Пытаемся найти бренд в атрибутах
      const brandAttribute = line.variant.product.attributes.find(
        (attr) => attr.attribute.slug === 'brand',
      );

      return {
        brand: brandAttribute ? brandAttribute.values[0]?.name : 'N/A',
        category: line.variant.product.category?.name || 'Default',
        image: line.thumbnail?.url,
        merchantName: this.configService.get<string>('AIRBAPAY_MERCHANT_NAME'),
        model: line.productName,
        price: line.unitPrice.gross.amount,
        quantity: line.quantity,
        sku: line.variant.sku,
      };
    });

    return {
      address: {
        delivery: order.shippingAddress.streetAddress1 || 'N/A',
        pickupPoint: this.configService.get<string>('PICKUP_POINT_ADDRESS'),
      },
      callbackUrl: this.configService.get<string>('AIRBAPAY_CALLBACK_URL'),
      channel: 'web',
      customer: {
        contact: {
          mobile: order.shippingAddress.phone.replace(/[^0-9]/g, '').slice(-10), // Очищаем и берем 10 цифр
        },
      },
      failureBackUrl: `${this.configService.get<string>(
        'FRONTEND_URL',
      )}/order-failure/${order.id}`,
      successBackUrl: `${this.configService.get<string>(
        'FRONTEND_URL',
      )}/order-success/${order.id}`,
      goods,
      isDelivery: true,
      loanLength: 0, // Все предложения
      orderId: order.number, // Используем номер заказа Saleor
      paymentPartners,
      productType: 'installment', // или 'loan'
      salesCode: this.configService.get<string>('AIRBAPAY_SALES_CODE'),
      salesPlace: order.shippingAddress.postalCode,
      totalCost: order.total.gross.amount,
    };
  }
}
