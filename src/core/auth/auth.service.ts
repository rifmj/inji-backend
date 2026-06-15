import {
  ForbiddenException,
  Injectable,
  NotAcceptableException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LogCtx, LoggerService } from '../shared/logger.service';
import { ConfigService } from '@nestjs/config';
import { assertParamExists } from '../utils/assert';

import { getNowUtcDate } from '../utils/date';
import { SmsService } from '../../app/messaging/sms/sms.service';
import { IdentityService } from './identity.service';
import { SaleorAuthService } from './saleor-auth.service';
import { AppleAuthService } from './apple-auth.service';

import { generateAuthCode } from './auth-code';
import bcrypt = require('bcrypt');
import jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;

// Confirmation sent back over WhatsApp once the user's code is matched to their
// phone. Edit here to change the wording.
const WHATSAPP_LOGIN_REPLY =
  'Готово ✅ Вход подтверждён — можете вернуться на сайт.';

@Injectable()
export class AuthService implements OnModuleInit {
  private smsCodeSalt: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly prismaService: PrismaService,
    private readonly smsService: SmsService,
    private readonly loggerService: LoggerService,
    private readonly configService: ConfigService,
    private readonly identityService: IdentityService,
    private readonly saleorAuthService: SaleorAuthService,
    private readonly appleAuthService: AppleAuthService,
  ) {}

  async onModuleInit() {
    const { codeSalt } = this.configService.get('sms');
    assertParamExists('sms.codeSalt', codeSalt);
    this.smsCodeSalt = codeSalt;

    const encryptionKey = this.configService.get<string>(
      'secrets.encryptionKey',
    );
    assertParamExists('secrets.encryptionKey', encryptionKey);
  }

  // ---------- public flows ----------

  async login(userId: string, code: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException();

    await this.requireValidSmsCode(code);
    return this.identityService.issueSession(user);
  }

  async refresh(userId: string, refresh: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user?.hashedRefreshToken) throw new UnauthorizedException();

    const isMatching = await bcrypt.compare(refresh, user.hashedRefreshToken);
    if (!isMatching) throw new UnauthorizedException();

    const sessions = await this.prismaService.session.findMany({
      where: { userId: user.id, isRevoked: false },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    const session = sessions[0];
    if (!session) throw new UnauthorizedException();

    const token = this.signJwt(session.id, 7);
    const newRefresh = this.signJwt(session.id, 30);
    const hashed = await bcrypt.hash(newRefresh, 10);
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { hashedRefreshToken: hashed },
    });
    return { token, refresh: newRefresh };
  }

  async requestCode({ phone, debug }: { phone: string; debug?: boolean }) {
    const nowUtcDate = getNowUtcDate();
    const oneHourAgo = getNowUtcDate();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    this.loggerService.info(
      { type: 'requestCode:start', phone, nowUtcDate, oneHourAgo },
      LogCtx.Auth,
    );

    const existingActive = await this.prismaService.smsRequestCode.findFirst({
      where: { phone, expiresAt: { gt: nowUtcDate } },
      orderBy: { createdAt: 'desc' },
    });
    const recentCount = await this.prismaService.smsRequestCode.count({
      where: { phone, createdAt: { gte: oneHourAgo } },
    });

    this.loggerService.info(
      { type: 'requestCode:code', phone, debug, existingActive, recentCount },
      LogCtx.Auth,
    );

    const smsCode = await this.smsService.sendSmsCode(`+7${phone}`);
    if (!smsCode) throw new UnauthorizedException();

    const hash = await bcrypt.hash(smsCode, this.smsCodeSalt);
    const expiresAt = getNowUtcDate();
    expiresAt.setMinutes(expiresAt.getMinutes() + 2);

    await this.prismaService.smsRequestCode.create({
      data: { value: hash, phone, expiresAt, createdAt: nowUtcDate },
    });

    return { userId: await this.findUserIdByPhone(phone) };
  }

  async requestWaitCode({ phone, debug }: { phone: string; debug?: boolean }) {
    this.loggerService.info(
      { type: 'requestWaitCode:start', phone, debug },
      LogCtx.Auth,
    );
    const waitCode = await this.smsService.sendWaitCode(`+7${phone}`);
    this.loggerService.info(
      { type: 'waitCode:sent', phone, waitCode },
      LogCtx.Auth,
    );
    return waitCode;
  }

  async checkCode(phone: string, code: string) {
    const nowUtcDate = getNowUtcDate();
    const hash = await bcrypt.hash(code, this.smsCodeSalt);
    const smsRequestCode = await this.prismaService.smsRequestCode.findFirst({
      where: { phone, value: hash, expiresAt: { gt: nowUtcDate } },
    });
    return !!smsRequestCode;
  }

  async register(body: RegisterDto) {
    this.loggerService.info(
      { type: 'register:start', phone: body.phone },
      LogCtx.Auth,
    );

    const existing = await this.findUserByPhoneIdentity(body.phone);
    if (existing?.isDeleted) {
      throw new NotAcceptableException('Аккаунт был удален');
    }
    if (existing) {
      throw new ForbiddenException(
        'Пользователь с таким телефоном уже зарегистрирован',
      );
    }

    await this.requireValidSmsCode(body.code);

    const user = await this.identityService.resolveUserByIdentity(
      'phone',
      body.phone,
      { phone: body.phone },
    );
    return this.identityService.issueSession(user);
  }

  // Guards the Green API WhatsApp webhook. Green API echoes the instance's
  // configured "webhookUrlToken" back as an "Authorization: Bearer <token>"
  // header on every delivery. We compare it against telegram.whatsappWebhookToken.
  // Mirrors TelegramService.isValidWebhookSecret: when no token is configured we
  // accept (fail-open) so unconfigured local envs keep working — set the env var
  // (and the matching Green API token) to actually enforce it.
  isValidWhatsappWebhookToken(authHeader?: string): boolean {
    const expected = this.configService.get<string>(
      'telegram.whatsappWebhookToken',
    );
    if (!expected) return true;
    const token = (authHeader ?? '').replace(/^Bearer\s+/i, '').trim();
    return token === expected;
  }

  // Sends a WhatsApp message back to the user via Green API's sendMessage. Used
  // to confirm a successful login on the chat the code arrived from. Best-effort:
  // outbound is skipped (no throw) when credentials are unset, and any transport
  // error is swallowed so the auth webhook never fails because of the reply.
  async sendWhatsappReply(
    chatId: string,
    message: string = WHATSAPP_LOGIN_REPLY,
  ): Promise<void> {
    const idInstance = this.configService.get<string>('greenApi.idInstance');
    const apiToken = this.configService.get<string>(
      'greenApi.apiTokenInstance',
    );
    const baseUrl =
      this.configService.get<string>('greenApi.baseUrl') ??
      'https://api.green-api.com';
    if (!idInstance || !apiToken) return;

    try {
      const res = await fetch(
        `${baseUrl}/waInstance${idInstance}/sendMessage/${apiToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId, message }),
        },
      );
      if (!res.ok) {
        console.warn(
          `sendWhatsappReply: Green API responded ${res.status}`,
        );
      }
    } catch (e) {
      console.warn('sendWhatsappReply failed', e);
    }
  }

  // Used by /v1/auth/tg, /v1/auth/whatsapp — opens a hash-based handshake.
  // (a) Returns the bot identifiers so the client builds deep-links from config
  // instead of hardcoding them. (c) Stamps a short TTL on the hash.
  async authSocialMessenger() {
    const ttlMinutes =
      this.configService.get<number>('telegram.authHashTtlMinutes') ?? 10;
    const expiresAt = new Date(getNowUtcDate().getTime() + ttlMinutes * 60_000);

    const data = await this.prismaService.telegramAuthRequest.create({
      data: { hash: generateAuthCode(), expiresAt },
    });
    return {
      hash: data.hash,
      telegramBot: this.configService.get<string>('telegram.authBotUsername'),
      whatsappPhone: this.configService.get<string>('telegram.whatsappPhone'),
    };
  }

  // Completes the hash handshake: the messenger handler has by now written
  // back the user's phone for this hash. We treat that phone as a verified
  // 'phone' identity and issue a session.
  //
  // (c) The hash is single-use and time-limited. While the bot has not yet
  // written the phone (or the hash is expired/already consumed) we return null
  // so polling clients keep waiting / give up by their own timeout, instead of
  // 401-ing (which would trip the client's token-refresh interceptor).
  async authTelegramWithHash(hash: string) {
    const data = await this.prismaService.telegramAuthRequest.findFirst({
      where: { hash },
    });
    if (!data || data.hash !== hash) throw new UnauthorizedException();
    if (data.usedAt) return null; // already consumed
    if (data.expiresAt && data.expiresAt.getTime() < getNowUtcDate().getTime()) {
      return null; // expired
    }
    if (!data.phone) return null; // bot has not written the phone yet

    const phone = data.phone.slice(-10);
    if (!phone) return null;

    // Atomically claim the hash so a session can be issued only once, even if
    // two checks race (web polling + native foreground re-check).
    const claim = await this.prismaService.telegramAuthRequest.updateMany({
      where: { hash, usedAt: null },
      data: { usedAt: getNowUtcDate() },
    });
    if (claim.count === 0) return null; // lost the race — already consumed

    const user = await this.identityService.resolveUserByIdentity(
      'phone',
      phone,
      { phone },
    );
    return this.identityService.issueSession(user);
  }

  async authCallWaitCode(id: string, phone: string) {
    const data = await this.prismaService.callWaitCode.findFirst({
      where: { id, userPhone: phone },
    });
    if (!data?.phone || !data.isConfirmed) {
      throw new UnauthorizedException();
    }
    const userPhone = data.userPhone?.slice(-10);
    if (!userPhone) return;

    const user = await this.identityService.resolveUserByIdentity(
      'phone',
      userPhone,
      { phone: userPhone },
    );
    return this.identityService.issueSession(user);
  }

  // ---------- Apple ----------

  async appleNonce() {
    return this.appleAuthService.issueNonce();
  }

  async appleSignIn(payload: {
    identityToken: string;
    authorizationCode?: string;
    nonce: string;
    fullName?: { givenName?: string; familyName?: string };
  }) {
    return this.appleAuthService.signIn(payload);
  }

  // ---------- account ----------

  // Soft-delete the user, revoke all sessions, revoke Apple grants, and
  // delete the Saleor customer. Best-effort on external systems — local
  // soft-delete always succeeds.
  async deleteAccount(userId: string) {
    this.loggerService.d(LogCtx.Auth, 'deleteAccount', { userId });
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException();

    await this.appleAuthService.revokeAllForUser(userId);
    await this.saleorAuthService.deleteAccount(user);

    await this.prismaService.session.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
    await this.prismaService.user.update({
      where: { id: userId },
      data: { isDeleted: true, hashedRefreshToken: null },
    });
  }

  // ---------- legacy helpers ----------

  async getAuthorizedRequestUserFromBearer(req: any) {
    const authToken = req.headers.authorization;
    if (!authToken) return null;
    const [bearer, token] = authToken.split(' ');
    if (bearer !== 'Bearer' || !token) return null;
    return this.validateToken(token);
  }

  async getAuthorizedRequestUser(req: any) {
    const authData = await this.getAuthorizedRequestUserFromBearer(req);
    if (authData?.sessionId) {
      return this.userService.getUserForRequest(authData);
    }
    return null;
  }

  validateToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (e) {
      throw new UnauthorizedException();
    }
  }

  async addDevice(userId: string, deviceId: string, pushToken: string) {
    this.loggerService.d(LogCtx.Auth, 'AddDevice', {
      userId,
      deviceId,
      pushToken,
    });
    const exist = await this.prismaService.userDevice.findFirst({
      where: { userId, deviceId, isRevoked: false },
    });
    if (!exist) {
      return this.prismaService.userDevice.create({
        data: { userId, deviceId, pushToken },
      });
    }
    if (exist.pushToken === pushToken) return exist;
    await this.prismaService.userDevice.update({
      where: { id: exist.id },
      data: { isRevoked: true },
    });
    return this.prismaService.userDevice.create({
      data: { userId, deviceId, pushToken },
    });
  }

  // ---------- private ----------

  private async requireValidSmsCode(code: string): Promise<void> {
    const hash = await bcrypt.hash(code, this.smsCodeSalt);
    const valid = await this.prismaService.smsRequestCode.findFirst({
      where: { value: hash, expiresAt: { gt: getNowUtcDate() } },
    });
    if (!valid) {
      throw new UnauthorizedException(
        'Неверный код доступа или время жизни кода истекло',
      );
    }
  }

  private async findUserIdByPhone(phone: string): Promise<string | null> {
    const user = await this.findUserByPhoneIdentity(phone);
    return user?.id ?? null;
  }

  private async findUserByPhoneIdentity(phone: string) {
    const identity = await this.prismaService.authIdentity.findUnique({
      where: { provider_subject: { provider: 'phone', subject: phone } },
      include: { user: true },
    });
    return identity?.user ?? null;
  }

  private signJwt(sessionId: string, expDays: number): string {
    const exp = new Date();
    exp.setDate(exp.getDate() + expDays);
    return jwt.sign({ sessionId, exp: exp.getTime() / 1000 }, SECRET);
  }
}
