import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AirbapayService } from './airbapay.service';
import { AirbaPayCallbackGuard } from './guards/airbapay-callback.guard';
import { AuthGuard } from '../../../core/auth/AuthGuard';
import { PrismaService } from '../../../core/prisma/prisma.service';
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
    private prisma: PrismaService,
  ) {}

  @Get('payment-partners')
  public paymentPartners() {
    return this.airbapayService.getPaymentPartners();
  }

  @Post('create-pre-order')
  @UseGuards(AuthGuard)
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
  @UseGuards(AirbaPayCallbackGuard)
  async paymentCallback(
    @Body()
    body: {
      // We register orderId as the Saleor checkout id in preCreateOrder, so it
      // comes back here as the checkout id.
      orderId: string;
      state: string;
      errorMessage?: string;
    },
  ) {
    const { orderId: checkoutId, state } = body;
    this.logger.log(
      `Payment callback for checkout ${checkoutId} with state ${state}. Body: ${JSON.stringify(
        body,
      )}`,
    );

    switch (state) {
      case 'confirmed':
      case 'completed': {
        // Idempotency: AirbaPay retries callbacks. Claim this checkout before
        // any side effect so a duplicate/concurrent confirmed callback is
        // skipped instead of throwing on the already-consumed checkout.
        const idempotencyKey = `airbapay:${checkoutId}`;
        try {
          await this.prisma.paymentWebhookEvent.create({
            data: { provider: 'airbapay', idempotencyKey },
          });
        } catch (e) {
          if ((e as { code?: string })?.code === 'P2002') {
            this.logger.log(
              `Duplicate AirbaPay confirmed callback for checkout ${checkoutId}, skipping`,
            );
            break;
          }
          throw e;
        }

        try {
          // Orders are created lazily on success. Create it, then mark it paid
          // so Saleor reflects the AirbaPay settlement (it previously stayed
          // unpaid).
          const orderId = await this.saleorService.createOrderFromCheckout(
            checkoutId,
          );
          const { orderMarkAsPaid } = await this.saleorService.markOrderAsPaid(
            orderId,
          );
          if (orderMarkAsPaid?.errors?.length) {
            this.logger.error(
              `Failed to mark order ${orderId} as paid: ${JSON.stringify(
                orderMarkAsPaid.errors,
              )}`,
            );
          }
          await this.prisma.paymentWebhookEvent.update({
            where: { idempotencyKey },
            data: { status: 'processed' },
          });
        } catch (err) {
          // Release the claim so a genuine AirbaPay retry can re-run.
          await this.prisma.paymentWebhookEvent.deleteMany({
            where: { idempotencyKey },
          });
          throw err;
        }
        break;
      }

      case 'rejected':
      case 'declined':
      case 'customer_cancelled':
      case 'merchant_cancelled':
        // No order exists yet (created only on success), so nothing to cancel —
        // just record the terminal failure.
        this.logger.log(
          `AirbaPay payment not completed (state=${state}) for checkout ${checkoutId}`,
        );
        break;

      case 'refunded':
        this.logger.warn(
          `AirbaPay refund for checkout ${checkoutId} needs manual handling`,
        );
        break;

      default:
        this.logger.warn(
          `Unhandled AirbaPay state '${state}' for checkout ${checkoutId}`,
        );
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
