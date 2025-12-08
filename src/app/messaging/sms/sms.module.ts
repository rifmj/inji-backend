import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../../../core/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    HttpModule.register({
      baseURL: process.env.SMSC_BASE_URL,
    }),
  ],
  providers: [SmsService],
  exports: [SmsService],
  controllers: [SmsController],
})
export class SmsModule {}
