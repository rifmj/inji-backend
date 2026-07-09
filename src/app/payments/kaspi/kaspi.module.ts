import { Module } from '@nestjs/common';
import { KaspiController } from './kaspi.controller';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { AuthModule } from '../../../core/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [KaspiController],
})
export class KaspiModule {}
