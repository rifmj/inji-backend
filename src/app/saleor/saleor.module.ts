import { Module } from '@nestjs/common';
import { SaleorService } from './saleor.service';
import { SaleorSyncService } from './saleor-sync.service';

@Module({
  providers: [SaleorService, SaleorSyncService],
  exports: [SaleorService, SaleorSyncService],
})
export class SaleorModule {}
