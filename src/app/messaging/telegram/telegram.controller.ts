import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Res,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Response } from 'express';
import { TelegramService } from './telegram.service';

// (b) Receives Telegram webhook updates (route: /v1/telegram/webhook) and
// forwards them into the auth bot. Used in webhook mode (serverless/Vercel).
@ApiExcludeController()
@Controller({
  path: 'telegram',
  version: ['1'],
})
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Body() update: unknown,
    @Headers('x-telegram-bot-api-secret-token') secret: string,
    @Res() res: Response,
  ) {
    if (!this.telegramService.isValidWebhookSecret(secret)) {
      res.status(401).send('invalid secret');
      return;
    }
    try {
      await this.telegramService.handleAuthUpdate(update);
    } catch (e) {
      // Always 200 so Telegram does not retry-storm us on handler errors.
      console.info('telegram webhook handler error', e);
    }
    res.status(200).send('ok');
  }
}
