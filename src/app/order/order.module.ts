import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PaymentsModule } from '../payments/payments.module';
import { SaleorModule } from '../saleor/saleor.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [PaymentsModule, SaleorModule],
  providers: [OrderService],
  controllers: [OrderController],
})
export class OrderModule {}
