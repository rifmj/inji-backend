import { Module } from '@nestjs/common';
import { PushService } from './push.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { LoggerService } from '../../../core/shared/logger.service';
import { PushController } from './push.controller';
import { SaleorModule } from '../../saleor/saleor.module';

@Module({
  imports: [PrismaModule, SaleorModule, LoggerService],
  providers: [PushService, LoggerService],
  exports: [PushService],
  controllers: [PushController],
})
export class PushModule {}
