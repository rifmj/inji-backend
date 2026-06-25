import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { WorkerGuard } from '../../../core/auth/WorkerGuard';

import { nanoid } from 'nanoid';

interface KaspiCreatePaymentRequestDto {
  userId: string;
  phone: string;
  checkoutData: any;
  amount: number;
  orderNumber?: string;
}

interface KaspiInvoiceResultDto {
  status: 'sent' | 'failed';
  error?: string;
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
        orderNumber: body.orderNumber ?? null,
      },
    });
    return request;
  }

  /**
   * Outbox for the phone-automation worker (`kaspi-automation --watch`).
   * Returns pending invoices and atomically claims them (status -> "sending")
   * so a worker crash can never re-send the same invoice (at-most-once: a stuck
   * "sending" row is safer to review than a double-sent invoice).
   */
  @Get('pending')
  @UseGuards(WorkerGuard)
  async pending() {
    const claimed = await this.prismaService.kaspiPaymentRequest.findMany({
      where: { status: 'pending', phone: { not: null } },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    if (claimed.length > 0) {
      await this.prismaService.kaspiPaymentRequest.updateMany({
        where: { id: { in: claimed.map((r) => r.id) } },
        data: { status: 'sending' },
      });
    }

    return claimed.map((r) => ({
      id: r.id,
      phone: r.phone,
      amount: String(Math.round(r.amount ?? 0)),
      orderNumber: r.orderNumber ?? r.id,
    }));
  }

  /**
   * The worker reports the outcome of one invoice. "sent" is terminal; "failed"
   * keeps the error for manual review (not retried automatically).
   */
  @Post(':id/result')
  @UseGuards(WorkerGuard)
  async result(@Param('id') id: string, @Body() body: KaspiInvoiceResultDto) {
    const data: { status: string; sentAt?: Date; error: string | null } =
      body.status === 'sent'
        ? { status: 'sent', sentAt: new Date(), error: null }
        : { status: 'failed', error: body.error ?? null };

    const { count } = await this.prismaService.kaspiPaymentRequest.updateMany({
      where: { id },
      data,
    });
    return { ok: count > 0 };
  }
}
