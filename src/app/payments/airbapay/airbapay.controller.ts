import {
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { AirbapayService } from './airbapay.service';
import {
  CancelPaymentDto,
  ConfirmPaymentDto,
  CreatePaymentDto,
  Payment,
  RefundPaymentDto,
} from './types';
import { PaymentService } from './payment.service';
import { Response } from 'express';
import { SaleorService } from '../../saleor/saleor.service';

@Controller('airbapay')
export class AirbapayController {
  private readonly logger = new Logger(AirbapayController.name);

  constructor(
    private airbapayService: AirbapayService,
    private paymentService: PaymentService,
    private saleorService: SaleorService,
  ) {}

  @Get('payment-partners')
  public paymentPartners() {
    return this.airbapayService.getPaymentPartners();
  }

  @Post('create-pre-order')
  public async createPreOrder(@Body() body: any) {
    return this.airbapayService.preCreateOrder(body);
  }

  @Post('/create')
  async createPayment(@Body() body: CreatePaymentDto): Promise<Payment> {
    return this.paymentService.create(body);
  }

  @Post('/confirm')
  async confirmPayment(@Body() body: ConfirmPaymentDto): Promise<Payment> {
    return this.paymentService.confirm(body);
  }

  @Post('/cancel')
  async cancelPayment(@Body() body: CancelPaymentDto): Promise<Payment> {
    return this.paymentService.cancel(body);
  }

  @Post('/refund')
  async refundPayment(@Body() body: RefundPaymentDto): Promise<Payment> {
    return this.paymentService.refund(body);
  }

  @Get('/')
  async getPayments(): Promise<Payment[]> {
    return this.paymentService.findAll();
  }

  @Post('authenticate')
  async authenticate(@Body() body: { username: string; password: string }) {
    const token = await this.airbapayService.authenticate(
      body.username,
      body.password,
    );
    return { token };
  }

  @Post('update-merchant-order-state')
  async updateMerchantOrderState(
    @Body() body: any,
    @Headers('Authorization') authHeader: string,
  ) {
    console.info('update-merchant-order-state', body, authHeader);
    const result = await this.airbapayService.updateMerchantOrderState(
      body,
      authHeader,
    );
    // // ВАЖНО: Мы ищем заказ в Saleor по его `number`, не по ID,
    // // так как AirbaPay возвращает `orderId`, который мы задали как `order.number`.
    // // Для более надежной связи лучше было бы найти заказ по метаполю airbaPayOrderId.
    //
    // // В данном примере будем считать, что orderId - это ID заказа в Saleor,
    // // который мы сохранили в метаданных. Но в DTO от AirbaPay это поле `orderId`.
    // // Здесь нужна четкая стратегия, что является связующим звеном.
    // // Предположим, что `orderId` из коллбэка - это `order.number` из Saleor.
    // // Для надежности нужно было бы реализовать поиск по метаполю.
    //
    // // --- ЗДЕСЬ ВАША БИЗНЕС-ЛОГИКА ---
    // // Для примера, логика будет упрощенной.
    // // В реальном проекте нужен поиск по метаполю.
    //
    // try {
    //   // Логика должна быть сложнее: найти заказ по orderId, который мы передали.
    //   // Здесь мы не знаем ID заказа Saleor, только его номер.
    //   // Для демонстрации пропустим этот шаг и представим, что ID известен.
    //   // const saleorOrder = await this.findSaleorOrderByNumber(saleorOrderNumber);
    //   const saleorOrderId = "gid://Order/xyz"; // ЗАГЛУШКА: ID нужно получить из БД или по доп. запросу.
    //
    //   switch (state) {
    //     case 'confirmed':
    //     case 'completed':
    //       this.logger.log(`Статус 'confirmed'/'completed'. Создание платежа для заказа ${saleorOrderId}.`);
    //       // Получаем детали заказа, чтобы узнать сумму
    //       const { order } = await this.saleorService.getOrderDetails(saleorOrderId);
    //       await this.saleorService.createPaymentTransaction(
    //         saleorOrderId,
    //         order.total.gross.amount,
    //         statusUpdate.orderId // Используем ID заказа Airba как референс
    //       );
    //       break;
    //
    //     case 'rejected':
    //     case 'customer_cancelled':
    //     case 'merchant_cancelled':
    //       this.logger.log(`Статус 'rejected'/'cancelled'. Отмена заказа ${saleorOrderId}.`);
    //       await this.saleorService.cancelOrder(saleorOrderId);
    //       break;
    //
    //     case 'refunded':
    //       this.logger.log(`Статус 'refunded'. Требуется ручная обработка возврата для ${saleorOrderId}.`);
    //       // Логика возврата: создание refund в Saleor
    //       break;
    //
    //     default:
    //       this.logger.log(`Получен необрабатываемый статус '${state}' для заказа ${saleorOrderNumber}`);
    //   }
    // } catch (error) {
    //   this.logger.error(`Ошибка при обработке статуса для заказа ${saleorOrderNumber}:`, error);
    // }
    return result;
  }

  @Get('payment-success')
  async paymentSuccess(@Res() res: Response) {
    console.info('get payment-success');
    this.logger.log('Payment success page requested');
    const html = await this.airbapayService.renderSuccessTemplate();
    this.logger.log('Success template rendered successfully');
    res.send(html);
  }

  @Get('payment-error')
  async paymentError(@Res() res: Response) {
    this.logger.log('Payment error page requested');
    const html = await this.airbapayService.renderErrorTemplate();
    this.logger.log('Error template rendered successfully');
    res.send(html);
  }

  @Post('payment-callback')
  async paymentCallback(
    @Body()
    body: {
      orderId: string;
      state: 'confirmed';
      errorMessage?: string;
    },
    @Headers('Authorization') authHeader: string,
  ) {
    this.logger.log(
      `Payment callback received for order ${body.orderId} with state ${
        body.state
      }. Body: ${JSON.stringify(body)}`,
    );

    if (body.state === 'confirmed') {
      await this.saleorService.createOrderFromCheckout(body.orderId);
    }

    return {
      status: 'success',
    };
  }

  @Get('/:id')
  async getPayment(@Param('id') id: string): Promise<Payment> {
    return this.paymentService.findById(id);
  }
}
