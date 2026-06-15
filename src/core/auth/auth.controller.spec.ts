import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

const VALID_HASH = 'a'.repeat(32);

const incomingWebhook = (overrides: Record<string, any> = {}) => ({
  typeWebhook: 'incomingMessageReceived',
  messageData: { textMessageData: { textMessage: VALID_HASH } },
  senderData: { chatId: '77001234567@c.us' },
  ...overrides,
});

describe('AuthController — WhatsApp (Green API) auth', () => {
  let controller: AuthController;

  const authServiceMock = {
    isValidWhatsappWebhookToken: jest.fn(() => true),
    authSocialMessenger: jest.fn(async () => ({ hash: 'h' })),
    authTelegramWithHash: jest.fn(async () => ({ accessToken: 't' })),
  };

  // Stable prisma mock so we can assert on the exact telegramAuthRequest methods
  // (the shared createMockPrisma proxy hands out a new mock per access).
  const telegramAuthRequest = { updateMany: jest.fn() };
  const prismaServiceMock = { telegramAuthRequest };

  beforeEach(async () => {
    jest.clearAllMocks();
    authServiceMock.isValidWhatsappWebhookToken.mockReturnValue(true);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('POST /whatsapp/hook (webhook token gate)', () => {
    it('rejects (401) and does NOT write the phone when the token is invalid', async () => {
      authServiceMock.isValidWhatsappWebhookToken.mockReturnValue(false);

      await expect(
        controller.authWhatsappHook(incomingWebhook(), 'Bearer wrong'),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(authServiceMock.isValidWhatsappWebhookToken).toHaveBeenCalledWith(
        'Bearer wrong',
      );
      expect(telegramAuthRequest.updateMany).not.toHaveBeenCalled();
    });

    it('captures the phone for the hash when the token is valid', async () => {
      const body = incomingWebhook();

      const result = await controller.authWhatsappHook(body, 'Bearer right');

      expect(result).toBe(true);
      expect(telegramAuthRequest.updateMany).toHaveBeenCalledWith({
        where: { hash: VALID_HASH },
        data: { phone: '77001234567', data: body },
      });
    });

    it('reads the hash from extendedTextMessageData as a fallback', async () => {
      const body = incomingWebhook({
        messageData: { extendedTextMessageData: { text: `  ${VALID_HASH}  ` } },
      });

      await controller.authWhatsappHook(body, 'Bearer right');

      expect(telegramAuthRequest.updateMany).toHaveBeenCalledWith({
        where: { hash: VALID_HASH },
        data: { phone: '77001234567', data: body },
      });
    });

    it('ignores non-incomingMessageReceived events', async () => {
      const result = await controller.authWhatsappHook(
        incomingWebhook({ typeWebhook: 'outgoingMessageStatus' }),
        'Bearer right',
      );

      expect(result).toBeUndefined();
      expect(telegramAuthRequest.updateMany).not.toHaveBeenCalled();
    });

    it('ignores messages whose text is not a 32-char hash', async () => {
      const result = await controller.authWhatsappHook(
        incomingWebhook({
          messageData: { textMessageData: { textMessage: 'too-short' } },
        }),
        'Bearer right',
      );

      expect(result).toBeUndefined();
      expect(telegramAuthRequest.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('hash + initiation endpoints delegate to AuthService', () => {
    it('POST /whatsapp opens a handshake via authSocialMessenger', async () => {
      await controller.authWhatsapp({});
      expect(authServiceMock.authSocialMessenger).toHaveBeenCalled();
    });

    it('POST /whatsapp/hash completes via authTelegramWithHash', async () => {
      await controller.authWhatsappWithHash(VALID_HASH);
      expect(authServiceMock.authTelegramWithHash).toHaveBeenCalledWith(
        VALID_HASH,
      );
    });
  });
});
