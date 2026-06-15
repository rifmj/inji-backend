import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

// A valid 8-char code from the auth-code alphabet (uppercase + digits, no 0/O/1/I).
const VALID_HASH = 'ABCD2345';

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
    sendWhatsappReply: jest.fn(async () => undefined),
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
    // Default: the code matches a pending request.
    telegramAuthRequest.updateMany.mockResolvedValue({ count: 1 });

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
      expect(authServiceMock.sendWhatsappReply).not.toHaveBeenCalled();
    });

    it('captures the phone for the code and replies when the token is valid', async () => {
      const body = incomingWebhook();

      const result = await controller.authWhatsappHook(body, 'Bearer right');

      expect(result).toBe(true);
      expect(telegramAuthRequest.updateMany).toHaveBeenCalledWith({
        where: { hash: VALID_HASH },
        data: { phone: '77001234567', data: body },
      });
      // Confirmation goes back to the sender's chat.
      expect(authServiceMock.sendWhatsappReply).toHaveBeenCalledWith(
        '77001234567@c.us',
      );
    });

    it('extracts the code embedded in a human-readable message', async () => {
      const body = incomingWebhook({
        messageData: {
          textMessageData: {
            textMessage: `Подтверждаю вход в Inji. Код: ${VALID_HASH}`,
          },
        },
      });

      await controller.authWhatsappHook(body, 'Bearer right');

      expect(telegramAuthRequest.updateMany).toHaveBeenCalledWith({
        where: { hash: VALID_HASH },
        data: { phone: '77001234567', data: body },
      });
    });

    it('reads the code from extendedTextMessageData as a fallback', async () => {
      const body = incomingWebhook({
        messageData: { extendedTextMessageData: { text: `  ${VALID_HASH}  ` } },
      });

      await controller.authWhatsappHook(body, 'Bearer right');

      expect(telegramAuthRequest.updateMany).toHaveBeenCalledWith({
        where: { hash: VALID_HASH },
        data: { phone: '77001234567', data: body },
      });
    });

    it('does NOT send a reply when the code matches no pending request', async () => {
      telegramAuthRequest.updateMany.mockResolvedValue({ count: 0 });

      const result = await controller.authWhatsappHook(
        incomingWebhook(),
        'Bearer right',
      );

      expect(result).toBe(true);
      expect(telegramAuthRequest.updateMany).toHaveBeenCalled();
      expect(authServiceMock.sendWhatsappReply).not.toHaveBeenCalled();
    });

    it('ignores non-incomingMessageReceived events', async () => {
      const result = await controller.authWhatsappHook(
        incomingWebhook({ typeWebhook: 'outgoingMessageStatus' }),
        'Bearer right',
      );

      expect(result).toBeUndefined();
      expect(telegramAuthRequest.updateMany).not.toHaveBeenCalled();
      expect(authServiceMock.sendWhatsappReply).not.toHaveBeenCalled();
    });

    it('ignores messages whose text carries no valid code', async () => {
      const result = await controller.authWhatsappHook(
        incomingWebhook({
          messageData: { textMessageData: { textMessage: 'too-short' } },
        }),
        'Bearer right',
      );

      expect(result).toBeUndefined();
      expect(telegramAuthRequest.updateMany).not.toHaveBeenCalled();
      expect(authServiceMock.sendWhatsappReply).not.toHaveBeenCalled();
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
