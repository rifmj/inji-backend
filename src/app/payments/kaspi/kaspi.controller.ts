import { Body, Controller, Post } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';

import { nanoid } from 'nanoid';

interface KaspiCreatePaymentRequestDto {
  userId: string;
  phone: string;
  checkoutData: any;
  amount: number;
}

@Controller('kaspi')
export class KaspiController {
  constructor(private prismaService: PrismaService) {}

  @Post('create-payment-request')
  async createPaymentRequest(
    @Body()
    body: KaspiCreatePaymentRequestDto,
  ) {
    const request = await this.prismaService.kaspiPaymentRequest.create({
      data: {
        id: nanoid(32),
        userId: body.userId,
        amount: body.amount,
        checkoutData: body.checkoutData,
        phone: body.phone,
      },
    });
    return request;
  }
}
