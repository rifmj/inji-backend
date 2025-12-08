import { Module } from '@nestjs/common';
import { TelegramModule } from './telegram/telegram.module';
import { SmsModule } from './sms/sms.module';
import { PushModule } from './push/push.module';

@Module({
  imports: [TelegramModule, SmsModule, PushModule],
  exports: [TelegramModule],
})
export class MessagingModule {}
