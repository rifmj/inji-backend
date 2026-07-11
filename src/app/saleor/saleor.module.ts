import { Module } from '@nestjs/common';
import { SaleorService } from './saleor.service';

@Module({
  providers: [SaleorService],
  exports: [SaleorService],
})
export class SaleorModule {}
