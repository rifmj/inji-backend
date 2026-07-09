import { Module } from '@nestjs/common';
import { AirbapayService } from './airbapay.service';
import { AirbapayController } from './airbapay.controller';
import { HttpModule } from '@nestjs/axios';
import { PaymentService } from './payment.service';
import { AirbaService } from './airba.service';
import { ConfigModule } from '@nestjs/config';
import { SaleorModule } from '../../saleor/saleor.module';
import { AirbaPayCallbackGuard } from './guards/airbapay-callback.guard';

@Module({
  imports: [HttpModule, ConfigModule, SaleorModule],
  providers: [
    AirbapayService,
    AirbaService,
    PaymentService,
    AirbaPayCallbackGuard,
  ],
  controllers: [AirbapayController],
})
export class AirbapayModule {}
