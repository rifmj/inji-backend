import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../../app/messaging/sms/sms.service';
import { LoggerService } from '../shared/logger.service';
import { IdentityService } from './identity.service';
import { SaleorAuthService } from './saleor-auth.service';
import { AppleAuthService } from './apple-auth.service';
import { getNowUtcDate } from '../utils/date';
import { AUTH_CODE_LENGTH, AUTH_CODE_RE } from './auth-code';

const VALID_HASH = 'a'.repeat(32);
const SESSION = { accessToken: 'access', refreshToken: 'refresh' };

describe('AuthService — WhatsApp / Telegram hash handshake', () => {
  let service: AuthService;
  let configValues: Record<string, any>;

  const telegramAuthRequest = {
    create: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
  };
  const prismaServiceMock = { telegramAuthRequest };

  const identityServiceMock = {
    resolveUserByIdentity: jest.fn(),
    issueSession: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn((key: string) => configValues[key]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    configValues = {
      'telegram.whatsappWebhookToken': undefined,
      'telegram.authHashTtlMinutes': 10,
      'telegram.authBotUsername': 'inji_dev_auth_bot',
      'telegram.whatsappPhone': '77474438640',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: {} },
        { provide: UserService, useValue: {} },
        { provide: PrismaService, useValue: prismaServiceMock },
        { provide: SmsService, useValue: {} },
        { provide: LoggerService, useValue: {} },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: IdentityService, useValue: identityServiceMock },
        { provide: SaleorAuthService, useValue: {} },
        { provide: AppleAuthService, useValue: {} },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('isValidWhatsappWebhookToken', () => {
    it('accepts anything when no token is configured (fail-open)', () => {
      configValues['telegram.whatsappWebhookToken'] = undefined;

      expect(service.isValidWhatsappWebhookToken(undefined)).toBe(true);
      expect(service.isValidWhatsappWebhookToken('Bearer whatever')).toBe(true);
    });

    describe('when a token is configured', () => {
      beforeEach(() => {
        configValues['telegram.whatsappWebhookToken'] = 'secret-token';
      });

      it('accepts the matching "Bearer <token>" header', () => {
        expect(service.isValidWhatsappWebhookToken('Bearer secret-token')).toBe(
          true,
        );
      });

      it('accepts a bare token without the Bearer scheme', () => {
        expect(service.isValidWhatsappWebhookToken('secret-token')).toBe(true);
      });

      it('is case-insensitive about the Bearer scheme', () => {
        expect(service.isValidWhatsappWebhookToken('bearer secret-token')).toBe(
          true,
        );
      });

      it('rejects a wrong token', () => {
        expect(service.isValidWhatsappWebhookToken('Bearer nope')).toBe(false);
      });

      it('rejects a missing header', () => {
        expect(service.isValidWhatsappWebhookToken(undefined)).toBe(false);
      });
    });
  });

  describe('sendWhatsappReply', () => {
    const realFetch = global.fetch;
    afterEach(() => {
      global.fetch = realFetch;
    });

    it('skips the call when Green API credentials are not configured', async () => {
      const fetchMock = jest.fn();
      global.fetch = fetchMock as any;

      await service.sendWhatsappReply('77001234567@c.us', 'hi');

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('POSTs the message to Green API sendMessage when configured', async () => {
      configValues['greenApi.idInstance'] = '1101';
      configValues['greenApi.apiTokenInstance'] = 'tok';
      configValues['greenApi.baseUrl'] = 'https://api.green-api.com';
      const fetchMock = jest.fn().mockResolvedValue({ ok: true });
      global.fetch = fetchMock as any;

      await service.sendWhatsappReply('77001234567@c.us', 'hello');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(
        'https://api.green-api.com/waInstance1101/sendMessage/tok',
      );
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toEqual({
        chatId: '77001234567@c.us',
        message: 'hello',
      });
    });

    it('never throws when the Green API call fails', async () => {
      configValues['greenApi.idInstance'] = '1101';
      configValues['greenApi.apiTokenInstance'] = 'tok';
      global.fetch = jest.fn().mockRejectedValue(new Error('network')) as any;

      await expect(
        service.sendWhatsappReply('77001234567@c.us', 'hello'),
      ).resolves.toBeUndefined();
    });
  });

  describe('authSocialMessenger', () => {
    it('creates a short code with a future TTL and returns the bot identifiers', async () => {
      telegramAuthRequest.create.mockImplementation(async ({ data }) => data);

      // The service stamps TTL off getNowUtcDate(), so anchor the test there too.
      const before = getNowUtcDate().getTime();
      const result = await service.authSocialMessenger();

      expect(result.hash).toHaveLength(AUTH_CODE_LENGTH);
      expect(result.hash).toMatch(AUTH_CODE_RE);
      expect(result.telegramBot).toBe('inji_dev_auth_bot');
      expect(result.whatsappPhone).toBe('77474438640');

      const arg = telegramAuthRequest.create.mock.calls[0][0].data;
      expect(arg.hash).toHaveLength(AUTH_CODE_LENGTH);
      // ~10 min TTL from now (slack for scheduling, but well under 11 min).
      expect(arg.expiresAt.getTime()).toBeGreaterThan(before + 9 * 60_000);
      expect(arg.expiresAt.getTime()).toBeLessThan(before + 11 * 60_000);
    });
  });

  describe('authTelegramWithHash', () => {
    const validRecord = () => ({
      hash: VALID_HASH,
      phone: '77001234567',
      expiresAt: new Date(getNowUtcDate().getTime() + 60_000),
      usedAt: null,
    });

    it('throws when the hash does not exist', async () => {
      telegramAuthRequest.findFirst.mockResolvedValue(null);

      await expect(service.authTelegramWithHash(VALID_HASH)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('returns null while the bot has not written the phone yet', async () => {
      telegramAuthRequest.findFirst.mockResolvedValue({
        ...validRecord(),
        phone: null,
      });

      expect(await service.authTelegramWithHash(VALID_HASH)).toBeNull();
      expect(identityServiceMock.issueSession).not.toHaveBeenCalled();
    });

    it('returns null when the hash is already consumed', async () => {
      telegramAuthRequest.findFirst.mockResolvedValue({
        ...validRecord(),
        usedAt: new Date(),
      });

      expect(await service.authTelegramWithHash(VALID_HASH)).toBeNull();
    });

    it('returns null when the hash is expired', async () => {
      telegramAuthRequest.findFirst.mockResolvedValue({
        ...validRecord(),
        expiresAt: new Date(getNowUtcDate().getTime() - 1_000),
      });

      expect(await service.authTelegramWithHash(VALID_HASH)).toBeNull();
    });

    it('returns null when it loses the single-use claim race', async () => {
      telegramAuthRequest.findFirst.mockResolvedValue(validRecord());
      telegramAuthRequest.updateMany.mockResolvedValue({ count: 0 });

      expect(await service.authTelegramWithHash(VALID_HASH)).toBeNull();
      expect(identityServiceMock.issueSession).not.toHaveBeenCalled();
    });

    it('claims the hash, resolves the phone identity, and issues a session', async () => {
      const user = { id: 'user-1' };
      telegramAuthRequest.findFirst.mockResolvedValue(validRecord());
      telegramAuthRequest.updateMany.mockResolvedValue({ count: 1 });
      identityServiceMock.resolveUserByIdentity.mockResolvedValue(user);
      identityServiceMock.issueSession.mockResolvedValue(SESSION);

      const result = await service.authTelegramWithHash(VALID_HASH);

      expect(telegramAuthRequest.updateMany).toHaveBeenCalledWith({
        where: { hash: VALID_HASH, usedAt: null },
        data: { usedAt: expect.any(Date) },
      });
      // phone is normalised to the last 10 digits.
      expect(identityServiceMock.resolveUserByIdentity).toHaveBeenCalledWith(
        'phone',
        '7001234567',
        { phone: '7001234567' },
      );
      expect(identityServiceMock.issueSession).toHaveBeenCalledWith(user);
      expect(result).toBe(SESSION);
    });
  });
});
