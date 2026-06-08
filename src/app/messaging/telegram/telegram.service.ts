import { Injectable, OnModuleInit } from '@nestjs/common';
import { session, Telegraf } from 'telegraf';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

// Path the auth bot's webhook is registered under. Must match the route in
// TelegramController (versioned → /v1/telegram/webhook).
export const TELEGRAM_WEBHOOK_PATH = '/v1/telegram/webhook';

@Injectable()
export class TelegramService implements OnModuleInit {
  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {}

  isLaunched = true;

  bot: Telegraf;

  authBot: Telegraf;

  chats: Record<string, string> = {};

  private get useWebhook(): boolean {
    return !!this.configService.get<boolean>('telegram.useWebhook');
  }

  private get webhookSecret(): string | undefined {
    return this.configService.get<string>('telegram.webhookSecret');
  }

  // The auth bot runs when: webhook mode is on, OR it is explicitly enabled
  // via TELEGRAM_AUTH_BOT_ENABLED, OR we are not in a dev environment. The
  // dev skip prevents developer laptops from polling the shared bot token.
  private get authBotEnabled(): boolean {
    if (this.useWebhook) return true;
    if (this.configService.get<boolean>('telegram.authBotEnabled')) return true;
    return process.env.ENV !== 'dev';
  }

  async createNotificationBot() {
    const token = this.configService.get<string>(
      'telegram.notificationBotToken',
    );
    if (!token) return;
    const bot = new Telegraf(token);
    bot.use(session());
    this.bot = bot;
    // The notification bot only sends messages, so it needs neither polling
    // nor a webhook — having the instance is enough for sendMessage().
  }

  async createAuthBot() {
    const token = this.configService.get<string>('telegram.authBotToken');
    if (!token) return;

    const authBot = new Telegraf(token);
    this.authBot = authBot;
    this.registerAuthHandlers(authBot);

    if (this.useWebhook) {
      // (b) Webhook mode — required on serverless/Vercel where long-polling
      // does not survive. Telegram pushes updates to TelegramController, which
      // forwards them to handleAuthUpdate().
      const domain = (
        this.configService.get<string>('telegram.webhookDomain') || ''
      ).replace(/\/+$/, '');
      if (!domain) {
        console.info('TelegramService: webhook mode but no webhookDomain set');
        return;
      }
      const url = `${domain}${TELEGRAM_WEBHOOK_PATH}`;
      await authBot.telegram.setWebhook(url, {
        secret_token: this.webhookSecret || undefined,
        drop_pending_updates: true,
      });
      console.info('TelegramService:authBotWebhookSet', url);
      return;
    }

    // Long-polling mode — for local/non-serverless deployments.
    authBot.launch().then(() => {
      console.info('TelegramService:authBotLaunch');
    });
    this.createExitListeners();
  }

  // Registers the /start + contact-share handlers. Used by both webhook and
  // polling modes.
  private registerAuthHandlers(authBot: Telegraf) {
    authBot.start(async (ctx) => {
      this.chats[ctx.chat.id] = ctx.startPayload;
      const msg = await ctx.reply(
        'Пожалуйста, укажите номер телефона, чтобы авторизоваться',
        {
          reply_markup: {
            keyboard: [
              [
                {
                  text: '📲 Войти',
                  request_contact: true,
                },
              ],
            ],
            one_time_keyboard: true,
          },
        },
      );
      console.info('MSGG', msg);
    });

    authBot.on('message', async (ctx) => {
      const payload = this.chats[ctx.chat.id];

      if (!payload) {
        ctx.sendMessage('Произошла ошибка при авторизации');
      } else {
        const stringified = JSON.stringify(ctx.update.message, null, 2);
        await this.prismaService.telegramAuthRequest.updateMany({
          where: {
            hash: payload,
          },
          data: {
            phone: (ctx.update.message as any).contact.phone_number,
            data: JSON.parse(stringified),
          },
        });
        ctx.sendMessage(
          'Вы успешно авторизовались. Можете перейти в приложение.',
        );
        await this.sendMessage(`Новый пользователь:\n${stringified}`);
      }
    });
  }

  // Validates the X-Telegram-Bot-Api-Secret-Token header Telegram echoes back
  // when a secret_token was configured. If no secret is configured we accept
  // (Telegram simply does not send the header).
  isValidWebhookSecret(token?: string): boolean {
    if (!this.webhookSecret) return true;
    return token === this.webhookSecret;
  }

  // Feeds a webhook update into the bot's middleware chain.
  async handleAuthUpdate(update: unknown): Promise<void> {
    if (!this.authBot) return;
    await this.authBot.handleUpdate(update as any);
  }

  createExitListeners() {
    process.once('SIGINT', () => {
      this.bot?.stop('SIGINT');
      this.authBot?.stop('SIGINT');
    });
    process.once('SIGTERM', () => {
      this.bot?.stop('SIGTERM');
      this.authBot?.stop('SIGTERM');
    });
  }

  async onModuleInit(): Promise<void> {
    // The notification bot only sends messages, so it is always built.
    try {
      await this.createNotificationBot();
    } catch (e) {
      console.info('Could not start notification bot', e);
    }

    if (!this.authBotEnabled) {
      console.info(
        'TelegramService: auth bot disabled (ENV=dev, no webhook/override)',
      );
      return;
    }
    try {
      await this.createAuthBot();
    } catch (e) {
      console.info('Could not start auth bot', e);
    }
  }

  sendMessage(text: string, chatId = '-1001489578377') {
    if (!this.isLaunched || !this.bot) {
      return;
    }
    return this.bot.telegram
      .sendMessage(chatId, text, {
        parse_mode: 'HTML',
      })
      .then((ok) => ok)
      .catch((err) => console.info('err', err));
  }
}
