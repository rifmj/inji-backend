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
    return this.paymentsService.create(data);
  }

  @Get('cards')
  async getSavedCards(@Query('phone') phone: string) {
    const user = await this.prismaService.user.findFirst({
      where: {
        phone,
      },
    });
    if (!user) throw new NotAcceptableException();

    return this.prismaService.savedCard.findMany({
      where: {
        userId: user.id,
      },
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
