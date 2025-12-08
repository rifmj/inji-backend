import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { GeoModule } from '../geo/geo.module';

@Module({
  imports: [HttpModule, PrismaModule, GeoModule],
  providers: [DeliveryService],
  controllers: [DeliveryController],
  exports: [DeliveryService],
})
export class DeliveryModule {}
