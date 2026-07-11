import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Res,
  ServiceUnavailableException,
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
        // AirbaPay retries callbacks, and creating the order consumes the
        // checkout (removeCheckout: true) so it cannot be recreated. We persist
        // progress in PaymentWebhookEvent and make each step resumable:
        //   1. claim the checkout (unique idempotencyKey)
        //   2. create the Saleor order once, persisting its id
        //   3. mark that order paid, then flip status to 'processed'
        // A retry after a partial failure resumes from the persisted order id
        // instead of re-creating; a duplicate after settlement is skipped.
        const idempotencyKey = `airbapay:${checkoutId}`;

        let resumeOrderId: string | undefined;
        try {
          await this.prisma.paymentWebhookEvent.create({
            data: { provider: 'airbapay', idempotencyKey },
          });
        } catch (e) {
          if ((e as { code?: string })?.code !== 'P2002') throw e;
          // The checkout is already claimed by an earlier callback.
          const existing = await this.prisma.paymentWebhookEvent.findUnique({
            where: { idempotencyKey },
          });
          if (!existing || existing.status === 'processed') {
            this.logger.log(
              `Duplicate/settled AirbaPay callback for checkout ${checkoutId}, skipping`,
            );
            break;
          }
          if (!existing.orderId) {
            // A concurrent attempt holds the claim but has not created the order
            // yet (a failed creation releases the claim, so a lingering claim
            // without an order means "in flight"). Don't create a second order —
            // ask AirbaPay to retry; by then it is settled or resumable.
            this.logger.warn(
              `AirbaPay callback for checkout ${checkoutId} already in progress; requesting retry`,
            );
            throw new ServiceUnavailableException('Callback already in progress');
          }
          // The order was created but not yet marked paid — resume at step 3.
          resumeOrderId = existing.orderId;
        }

        // Step 2: create the order once and persist its id before touching
        // Saleor further, so a later failure resumes instead of re-creating.
        let orderId = resumeOrderId;
        if (!orderId) {
          try {
            orderId = await this.saleorService.createOrderFromCheckout(
              checkoutId,
            );
          } catch (err) {
            // The order was NOT created (checkout still intact), so release the
            // claim and let a genuine AirbaPay retry re-run creation.
            await this.prisma.paymentWebhookEvent.deleteMany({
              where: { idempotencyKey },
            });
            throw err;
          }
          await this.prisma.paymentWebhookEvent.update({
            where: { idempotencyKey },
            data: { orderId },
          });
        } else if (await this.saleorService.isOrderPaid(orderId)) {
          // Resuming a prior attempt that already marked the order paid but
          // crashed before settling the webhook row. Re-marking would error on
          // an already-paid order and loop forever, so just settle and finish.
          await this.prisma.paymentWebhookEvent.update({
            where: { idempotencyKey },
            data: { status: 'processed' },
          });
          break;
        }

        // Step 3: mark it paid. On failure, throw WITHOUT flipping to 'processed'
        // so AirbaPay's retry resumes this step against the already-created
        // order (previously the error was swallowed, leaving it unpaid forever).
        const { orderMarkAsPaid } = await this.saleorService.markOrderAsPaid(
          orderId,
        );
        if (orderMarkAsPaid?.errors?.length) {
          this.logger.error(
            `Failed to mark order ${orderId} as paid: ${JSON.stringify(
              orderMarkAsPaid.errors,
            )}`,
          );
          throw new Error(
            `AirbaPay: markOrderAsPaid failed for order ${orderId}`,
          );
        }

        await this.prisma.paymentWebhookEvent.update({
          where: { idempotencyKey },
          data: { status: 'processed' },
        });
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
