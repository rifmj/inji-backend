import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AuthModule } from '../../core/auth/auth.module';
import { KaspiModule } from './kaspi/kaspi.module';
import { AirbapayModule } from './airbapay/airbapay.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [PrismaModule, AuthModule, HttpModule, KaspiModule, AirbapayModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
