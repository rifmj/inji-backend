import { Injectable, OnModuleInit } from '@nestjs/common';
import { session, Telegraf } from 'telegraf';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

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

  async createNotificationBot() {
    const bot = new Telegraf(
      this.configService.get('telegram.notificationBotToken'),
    );
    bot.use(session());
    this.bot = bot;
  }

  async createAuthBot() {
    const authBot = new Telegraf(
      this.configService.get('telegram.authBotToken'),
    );
    this.authBot = authBot;
    this.authBot.start(async (ctx) => {
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

    this.authBot.launch().then(() => {
      console.info('TelegramService:authBotLaunch');
    });

    this.authBot.on('message', async (ctx) => {
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

  createExitListeners() {
    process.once('SIGINT', () => {
      this.bot.stop('SIGINT');
      this.authBot.stop('SIGINT');
    });
    process.once('SIGTERM', () => {
      this.bot.stop('SIGTERM');
      this.authBot.stop('SIGTERM');
    });
  }

  onModuleInit(): any {
    if (process.env.ENV === 'dev') {
      return;
    }
    try {
      Promise.all([this.createAuthBot(), this.createNotificationBot()]);
      this.createExitListeners();
    } catch (e) {
      console.info('Could not start bot', e);
    }
  }

  sendMessage(text: string, chatId = '-1001489578377') {
    if (!this.isLaunched) {
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
