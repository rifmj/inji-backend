import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../core/shared/logger.service';
import { GraphQLClient } from 'graphql-request';
import { SaleorService } from '../saleor/saleor.service';
import {
  AddressCreatedHook,
  AddressUpdatedHook,
} from './types/AddressCreatedHook';
import { SaleorCustomerCreatedHook } from './types/SaleorCustomerCreatedHook';
import { SaleorCustomerUpdatedHook } from './types/SaleorCustomerUpdatedHook';
import { PrismaService } from '../../core/prisma/prisma.service';
import { OrderHooksService } from './order-hooks.service';

@Injectable()
export class HooksService {
  client: GraphQLClient;

  constructor(
    private loggerService: LoggerService,
    private saleorService: SaleorService,
    private prismaService: PrismaService,
    private orderHooksService: OrderHooksService,
  ) {
    this.client = this.saleorService.client;
    this.orderHooksService.setGraphQLClient(this.client);
  }

  async addressCreated(body: AddressCreatedHook) {
    this.loggerService.info(body, 'saleor-address-created');
    return null;
  }

  async addressUpdated(body: AddressUpdatedHook) {
    this.loggerService.info(body, 'saleor-address-updated');
    return null;
  }

  async addressDeleted(body: any) {
    this.loggerService.info(body, 'saleor-address-deleted');
    return null;
  }

  async customerCreated(body: SaleorCustomerCreatedHook) {
    this.loggerService.info(body, 'saleor-customer-created');
    return null;
  }

  async customerUpdated(body: SaleorCustomerUpdatedHook) {
    this.loggerService.info(body, 'saleor-customer-updated');
    return null;
  }

  fulfilmentCreated(body: any) {
    this.loggerService.info(body, 'saleor-fulfilment-created');
    return null;
  }

  async orderCreated(body: any) {
    return this.orderHooksService.handleOrderCreated(body);
  }

  async orderUpdated(body: any, headers: any) {
    return this.orderHooksService.handleOrderUpdated(body, headers);
  }

  async orderFulfilled(body: any) {
    return this.orderHooksService.handleOrderFulfilled(body);
  }

  transactionActionRequest(body: any) {
    this.loggerService.info(body, 'saleor-transaction-action-request');
    return null;
  }

  async verifyWaitCode(phone: string) {
    const waitCode = await this.prismaService.callWaitCode.findFirst({
      where: {
        userPhone: phone,
        isConfirmed: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    if (waitCode?.id) {
      await this.prismaService.callWaitCode.update({
        where: { id: waitCode.id },
        data: { isConfirmed: true },
      });
    }
    return null;
  }
}
