import { Module } from '@nestjs/common';
import { AirbapayService } from './airbapay.service';
import { AirbapayController } from './airbapay.controller';
import { HttpModule } from '@nestjs/axios';
import { PaymentService } from './payment.service';
import { AirbaService } from './airba.service';
import { ConfigModule } from '@nestjs/config';
import { SaleorModule } from '../../saleor/saleor.module';

@Module({
  imports: [HttpModule, ConfigModule, SaleorModule],
  providers: [AirbapayService, AirbaService, PaymentService],
  controllers: [AirbapayController],
})
export class AirbapayModule {}
