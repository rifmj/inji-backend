import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { HooksService } from './hooks.service';
import { PaymentHooksService } from './payment-hooks.service';
import { Request } from 'express';
import { AddressCreatedHook } from './types/AddressCreatedHook';
import { SaleorOrderUpdatedHook } from './types/SaleorOrderUpdatedHook';
import { GeoService } from '../geo/geo.service';
import { nodeCache } from 'src/core/utils/cache';
import { OrderCreatedHook } from './types/OrderHooks';

@Controller('hooks')
export class HooksController {
  constructor(
    private hooksService: HooksService,
    private geoService: GeoService,
    private paymentHooksService: PaymentHooksService,
  ) {}

  /**
   * Shop
   */

  /**
   * Address
   */
  @Post('shop/address-created')
  addressCreated(@Req() req: Request, @Body() body: AddressCreatedHook) {
    return this.hooksService.addressCreated(body);
  }

  @Post('shop/address-updated')
  addressUpdated(@Req() req: Request, @Body() body: any) {
    return this.hooksService.addressUpdated(body);
  }

  @Post('shop/address-deleted')
  addressDeleted(@Req() req: Request, @Body() body: any) {
    return this.hooksService.addressDeleted(body);
  }

  @Post('shop/transaction-action-request')
  transactionActionRequest(@Req() req: Request, @Body() body: any) {
    return this.hooksService.transactionActionRequest(body);
  }

  /**
   * Customer
   */
  @Post('shop/customer-created')
  customerCreated(@Req() req: Request, @Body() body: any) {
    return this.hooksService.customerCreated(body);
  }

  @Post('shop/customer-updated')
  customerUpdated(@Req() req: Request, @Body() body: any) {
    return this.hooksService.customerUpdated(body);
  }

  @Post('shop/fulfilment-created')
  fulfilmentCreated(@Req() req: Request, @Body() body: any) {
    return this.hooksService.fulfilmentCreated(body);
  }

  @Post('shop/order-updated')
  orderUpdated(@Req() req: Request, @Body() body: SaleorOrderUpdatedHook[]) {
    return this.hooksService.orderUpdated(body, req.headers);
  }

  @Post('shop/order-created')
  orderCreated(@Req() req: Request, @Body() body: OrderCreatedHook[]) {
    return this.hooksService.orderCreated(body);
  }

  @Post('shop/order-fulfilled')
  orderFulfilled(@Req() req: Request, @Body() body: any) {
    return this.hooksService.orderFulfilled(body);
  }

  /**
   * Payments
   */
  @Post('payments/check')
  checkPayment(@Req() req: Request, @Body() body: any) {
    return this.paymentHooksService.checkPayment(body);
  }

  @Post('payments/pay')
  payPayment(@Req() req: Request, @Body() body: any) {
    return this.paymentHooksService.payPayment(body);
  }

  @Post('payments/fail')
  failPayment(@Req() req: Request, @Body() body: any) {
    return this.paymentHooksService.failPayment(body);
  }

  @Post('payments/cancel')
  cancelPayment(@Req() req: Request, @Body() body: any) {
    return this.paymentHooksService.cancelPayment(body);
  }

  @Post('payments/confirm')
  confirmPayment(@Req() req: Request, @Body() body: any) {
    return this.paymentHooksService.confirmPayment(body);
  }

  @Post('payments/refund')
  refundPayment(@Req() req: Request, @Body() body: any) {
    return this.paymentHooksService.refundPayment(body);
  }

  @Post('paymentGateways')
  @HttpCode(200)
  paymentGateways(
    @Req() req: Request,
    @Body()
    body: any,
  ) {
    return [
      {
        id: 'kaspi',
        name: 'Kaspi.kz',
        currencies: ['KZT'],
        config: [],
      },
    ];
  }

  @Post('shippingMethods')
  @HttpCode(200)
  async shippingMethods(
    @Req() req: Request,
    @Body()
    body: any,
  ) {
    const order = body[0];
    console.info('shippingMethods:GET BODY', JSON.stringify(body));

    if (!order) {
      return [];
    }
    const shipping_address = order.shipping_address;
    if (!shipping_address) {
      return [];
    }
    const streetAddress1 = shipping_address.street_address_1;
    const phone = shipping_address.phone || order?.billing_address?.phone;
    if (!streetAddress1 || !phone) {
      return [];
    }
    const key = `geo-ya-shipping-est:${streetAddress1}:${phone}`;
    const cached = nodeCache.get(key);

    if (cached) {
      return cached;
    }

    console.info('shippingMethods:estimated1', key);

    const estimated = await this.geoService.estimateDeliveryByAddressQuery(
      streetAddress1,
      phone,
    );

    console.info('shippingMethods:estimated2', key);

    if (!estimated) {
      return [];
    }
    if (!estimated?.serviceLevels?.length) {
      return [];
    }
    const price = estimated.serviceLevels[0].price_raw;

    if (!price) {
      return [];
    }

    const res = [
      {
        id: 'taxi-yandex',
        name: 'Такси Яндекс',
        amount: price,
        currency: 'KZT',
      },
    ];

    nodeCache.set(key, res, 60 * 5);
    return res;
  }

  @Post('sms')
  @HttpCode(200)
  sms(
    @Req() req: Request,
    @Body()
    body: any,
  ) {
    console.info('SMSC.KZ', body);
    if (body?.waitcall === '1') {
      return this.hooksService.verifyWaitCode(body.phone);
    }
    return null;
  }
}
