import {
  Body,
  Controller,
  Get,
  NotAcceptableException,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '../../core/auth/AuthGuard';
import { ApiBasicAuth } from '@nestjs/swagger';
import { User } from '../../core/auth/user.decorator';
import { PrismaService } from '../../core/prisma/prisma.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private prismaService: PrismaService,
  ) {}

  @UseGuards(AuthGuard)
  @ApiBasicAuth('JWT')
  @Post()
  create(@Body() data, @User('id') userId: string) {
    return this.paymentsService.create(data, userId);
  }

  @UseGuards(AuthGuard)
  @ApiBasicAuth('JWT')
  @Get('cards')
  async getSavedCards(@User('id') userId: string) {
    return this.prismaService.savedCard.findMany({
      where: { userId },
      select: {
        id: true,
        cardLastFour: true,
        cardToken: true,
        createdAt: true,
      },
    });
  }

  @Get('request')
  async getRequest(@Query('referenceId') referenceId: string) {
    if (referenceId) {
      await this.paymentsService.updateInvoiceStatus(referenceId);
      return { data: 1 };
    }
    throw new NotAcceptableException();
  }
}
