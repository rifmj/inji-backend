import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AuthModule } from '../../core/auth/auth.module';
import { KaspiModule } from './kaspi/kaspi.module';
import { AirbapayModule } from './airbapay/airbapay.module';
import { AirbaService } from './airbapay/airba.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [PrismaModule, AuthModule, HttpModule, KaspiModule, AirbapayModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, AirbaService],
  exports: [AirbaService],
})
export class PaymentsModule {}
