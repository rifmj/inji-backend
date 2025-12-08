import { Module } from '@nestjs/common';
import { HooksService } from './hooks.service';
import { OrderHooksService } from './order-hooks.service';
import { PaymentHooksService } from './payment-hooks.service';
import { HooksController } from './hooks.controller';
import { TelegramModule } from '../messaging/telegram/telegram.module';
import { SearchModule } from '../../core/search/search.module';
import { LoggerService } from '../../core/shared/logger.service';
import { HttpModule } from '@nestjs/axios';
import { SaleorModule } from '../saleor/saleor.module';
import { PushModule } from '../messaging/push/push.module';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { GeoModule } from '../geo/geo.module';

@Module({
  imports: [
    PrismaModule,
    SearchModule,
    SaleorModule,
    PushModule,
    HttpModule.register({}),
    TelegramModule,
    GeoModule,
  ],
  providers: [
    HooksService,
    OrderHooksService,
    PaymentHooksService,
    LoggerService,
  ],
  controllers: [HooksController],
  exports: [HooksService, OrderHooksService, PaymentHooksService],
})
export class HooksModule {}
