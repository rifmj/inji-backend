import { Module } from '@nestjs/common';
import { SaleorService } from './saleor.service';
import { SaleorController } from './saleor.controller';
import { SaleorSyncService } from './saleor-sync.service';

@Module({
  providers: [SaleorService, SaleorSyncService],
  controllers: [SaleorController],
  exports: [SaleorService, SaleorSyncService],
})
export class SaleorModule {}
