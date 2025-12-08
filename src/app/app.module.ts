import { Module } from '@nestjs/common';
import { PaymentsModule } from './payments/payments.module';
import { HooksModule } from './hooks/hooks.module';
import { CatalogModule } from './catalog/catalog.module';
import { GeoModule } from './geo/geo.module';
import { MessagingModule } from './messaging/messaging.module';
import { CommonModule } from '../core/common/common.module';
import { SaleorModule } from './saleor/saleor.module';
import { RemoteConfigModule } from './remote-config/remote-config.module';
import { DeliveryModule } from './delivery/delivery.module';
import { OrderModule } from './order/order.module';

@Module({
  imports: [
    CommonModule,
    PaymentsModule,
    HooksModule,
    CatalogModule,
    GeoModule,
    MessagingModule,
    SaleorModule,
    RemoteConfigModule,
    DeliveryModule,
    OrderModule,
  ],
})
export class AppModule {}
