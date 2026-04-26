import { Module } from '@nestjs/common';
import { KaspiController } from './kaspi.controller';
import { PrismaModule } from '../../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KaspiController],
})
export class KaspiModule {}
