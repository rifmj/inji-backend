import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';
import { PrismaModule } from '../prisma/prisma.module';
import { LoggerService } from '../shared/logger.service';
import { TelegramModule } from '../../app/messaging/telegram/telegram.module';
import { SmsModule } from '../../app/messaging/sms/sms.module';

@Module({
  imports: [
    UserModule,
    PrismaModule,
    SmsModule,
    TelegramModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '36000s' },
    }),
  ],
  providers: [AuthService, LoggerService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
