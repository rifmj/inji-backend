import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { nanoid } from 'nanoid';

interface CreateInvoiceData {
  amount: number;
  user_phone: string;
  checkoutId: string;
}

@Injectable()
export class PaymentsService {
  constructor(private prismaService: PrismaService) {}

  async updateInvoiceStatus(id: string) {}

  async create(data) {
    return this.createInvoice(data);
  }

  async createInvoice(data: CreateInvoiceData) {
    const id = nanoid(32);
    const createdInvoice = await this.prismaService.invoice.create({
      data: {
        id,
        checkoutId: data.checkoutId,
        amount: data.amount,
        userPhone: data.user_phone,
      },
    });
    return {
      id: createdInvoice.id,
    };
  }
}
