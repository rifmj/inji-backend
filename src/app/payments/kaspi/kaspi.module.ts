import { Module } from '@nestjs/common';
import { KaspiService } from './kaspi.service';
import { KaspiController } from './kaspi.controller';
import { PrismaModule } from '../../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [KaspiService],
  controllers: [KaspiController],
})
export class KaspiModule {}
