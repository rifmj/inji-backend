import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  CancelPaymentDto,
  ConfirmPaymentDto,
  CreatePaymentDto,
  Payment,
  RefundPaymentDto,
} from './types';

export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePaymentDto): Promise<Payment | undefined> {
    // ...
    return;
  }

  async confirm(dto: ConfirmPaymentDto): Promise<Payment | undefined> {
    // ...
    return;
  }

  async cancel(dto: CancelPaymentDto): Promise<Payment | undefined> {
    // ...
    return;
  }

  async refund(dto: RefundPaymentDto): Promise<Payment | undefined> {
    // ...
    return;
  }

  async findById(id: string): Promise<Payment | undefined> {
    // ...
    return;
  }

  async findAll(): Promise<Payment[]> {
    // ...
    return [];
  }
}
