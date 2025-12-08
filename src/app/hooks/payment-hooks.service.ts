import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../core/shared/logger.service';
import { GraphQLClient } from 'graphql-request';
import { PrismaService } from '../../core/prisma/prisma.service';
import { GET_CHECKOUT_QUERY, ORDER_CREATE_MUTATION } from './graphql/mutations';
import { SaleorService } from '../saleor/saleor.service';

@Injectable()
export class PaymentHooksService {
  private client: GraphQLClient;

  constructor(
    private loggerService: LoggerService,
    private prismaService: PrismaService,
    private saleorService: SaleorService,
  ) {
    this.client = this.saleorService.client;
  }

  private async updateInvoiceStatus(
    referenceId: string,
    status: number,
  ): Promise<void> {
    try {
      await this.prismaService.invoice.updateMany({
        where: { referenceId },
        data: { status },
      });
    } catch (error) {
      this.loggerService.error(
        { error, referenceId, status },
        'Failed to update invoice status',
      );
      throw error;
    }
  }

  async payPayment(body: {
    InvoiceId: string;
    PaymentAmount: string;
    TransactionId: string;
    AccountId: string;
    Token: string;
    CardLastFour: string;
  }): Promise<boolean> {
    this.loggerService.info(body, 'cloudpayments-pay');

    try {
      // Extract phone number from AccountId (remove @inji.kz suffix)
      const phone = body.AccountId.split('@')[0].replace('c', '');

      // Find user by phone number
      const user = await this.prismaService.user.findUnique({
        where: { phone },
      });

      if (user) {
        // Save card information
        await this.prismaService.savedCard.create({
          data: {
            userId: user.id,
            cardToken: body.Token,
            cardLastFour: body.CardLastFour,
          },
        });
      }

      const createdOrder = await this.client.request(ORDER_CREATE_MUTATION, {
        id: body.InvoiceId,
      });

      this.loggerService.info(
        { createdOrder, InvoiceId: body.InvoiceId },
        'Order created from checkout',
      );

      const createdOrderId = createdOrder.orderCreateFromCheckout?.order?.id;
      if (!createdOrderId) {
        throw new Error('Failed to create order: No order ID returned');
      }

      await this.updateInvoiceStatus(body.InvoiceId, 1);
      return true;
    } catch (error) {
      this.loggerService.error(
        {
          error,
          error_response: error?.response,
          error_msg: error?.message,
          status: 'createdOrderError',
          InvoiceId: body.InvoiceId,
        },
        'Failed to process payment',
      );

      try {
        await this.updateInvoiceStatus(body.InvoiceId, -1);
      } catch (updateError) {
        this.loggerService.error(
          { error: updateError, InvoiceId: body.InvoiceId },
          'Failed to update invoice status to failed',
        );
      }

      return false;
    }
  }

  failPayment(body: any) {
    this.loggerService.info(body, 'cloudpayments-fail');
    return {
      code: 0,
    };
  }

  cancelPayment(body: any) {
    this.loggerService.info(body, 'cloudpayments-cancel');
    return {
      code: 0,
    };
  }

  async checkPayment(body: any) {
    this.loggerService.info(body, 'cloudpayments-check');
    console.info('cloudpayments-check', body);
    try {
      const getInvoiceById = await this.client.request(GET_CHECKOUT_QUERY, {
        id: body.InvoiceId,
      });
      this.loggerService.info({ getInvoiceById, body }, 'cloudpayments-check');
      console.info('cloudpayments-check-1', { getInvoiceById, body });
    } catch (e) {
      this.loggerService.info({ error: e, body }, 'cloudpayments-check');
      console.info('cloudpayments-check-2-error', { error: e, body });
    }
    return {
      code: 0,
    };
  }

  confirmPayment(body: any) {
    this.loggerService.info(body, 'cloudpayments-confirm');
    return {
      code: 0,
    };
  }

  refundPayment(body: any) {
    this.loggerService.info(body, 'cloudpayments-refund');
    return {
      code: 0,
    };
  }
}
