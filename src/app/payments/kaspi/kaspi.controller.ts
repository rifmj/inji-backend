import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { WorkerGuard } from '../../../core/auth/WorkerGuard';
import { AuthGuard } from '../../../core/auth/AuthGuard';
import { User } from '../../../core/auth/user.decorator';

import { nanoid } from 'nanoid';

interface KaspiCreatePaymentRequestDto {
  // userId is intentionally NOT taken from the body — it is derived from the
  // authenticated session so a caller can't attribute a request to another user.
  phone: string;
  // Full Saleor checkout blob (used to build the invoice; carries the checkout
  // id used for idempotency). Typed `any` to match Prisma's Json input.
  checkoutData: any;
  amount: number;
  orderNumber?: string;
}

interface KaspiInvoiceResultDto {
  status: 'sent' | 'failed';
  error?: string;
}

/**
 * Kaspi has no payment API and no paid-callback. By design, this flow only
 * REQUESTS an invoice (stored here, sent by the phone-automation worker) — it
 * deliberately never creates or marks-paid a Saleor order. Turning a paid Kaspi
 * invoice into a Saleor order is a manual operator step, out of this codebase's
 * scope. So the absence of any orderCreateFromCheckout / markOrderAsPaid call
 * here is intentional, not a gap (unlike the card and AirbaPay flows).
 */
@Controller('kaspi')
export class KaspiController {
  constructor(private prismaService: PrismaService) {}

  @Post('create-payment-request')
  @UseGuards(AuthGuard)
  async createPaymentRequest(
    @User('id') userId: string,
    @Body()
    body: KaspiCreatePaymentRequestDto,
  ) {
    // Validate server-side — the body reaches us straight from the client.
    if (!body.phone) {
      throw new BadRequestException('phone is required');
    }
    if (!Number.isFinite(body.amount) || body.amount <= 0) {
      throw new BadRequestException('amount must be a positive number');
    }

    // Idempotency: one Kaspi invoice per checkout. Guards against client retries
    // (axios-retry re-sends POSTs on network errors) creating duplicate invoices.
    const checkoutId = body.checkoutData?.id;
    if (checkoutId) {
      const idempotencyKey = `kaspi:${checkoutId}`;
      try {
        await this.prismaService.paymentWebhookEvent.create({
          data: { provider: 'kaspi', idempotencyKey },
        });
      } catch (e) {
        if ((e as { code?: string })?.code === 'P2002') {
          // Already requested for this checkout — don't send a second invoice.
          return { ok: true, duplicate: true };
        }
        throw e;
      }

      try {
        return await this.createRequestRow(userId, body);
      } catch (e) {
        // Release the claim so a genuine retry can re-create the row.
        await this.prismaService.paymentWebhookEvent.deleteMany({
          where: { idempotencyKey },
        });
        throw e;
      }
    }

    return this.createRequestRow(userId, body);
  }

  private createRequestRow(userId: string, body: KaspiCreatePaymentRequestDto) {
    return this.prismaService.kaspiPaymentRequest.create({
      data: {
        id: nanoid(32),
        userId,
        amount: body.amount,
        checkoutData: body.checkoutData,
        phone: body.phone,
        orderNumber: body.orderNumber ?? null,
      },
    });
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
