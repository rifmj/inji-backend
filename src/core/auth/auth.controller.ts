import {
  Body,
  Controller,
  Delete,
  Headers,
  Post,
  Req,
  Res,
  Session,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBasicAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RefreshDto } from './dto/refresh.dto';
import { RefreshResponseDto } from './dto/refresh-response.dto';
import { AuthGuard } from './AuthGuard';
import { User } from './user.decorator';
import { Request, Response } from 'express';

import { RequestCodeDto } from './dto/request-code.dto';
import { CheckCodeDto } from './dto/check-code.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AUTH_CODE_RE } from './auth-code';

@ApiTags('auth')
@Controller({
  path: 'auth',
  version: ['1'],
})
export class AuthController {
  constructor(
    private authService: AuthService,
    private prismaService: PrismaService,
  ) {}

  @ApiOperation({
    summary: 'Запросить код доступа по номеру мобильного телефона',
  })
  @Post('request-code')
  async requestCode(@Body() body: RequestCodeDto) {
    return this.authService.requestCode({
      phone: body.phone,
      debug: body.debug,
    });
  }

  @ApiOperation({
    summary: 'Запросить flash-call для авторизации',
  })
  @Post('request-wait-code')
  async requestWaitCode(@Body() body: RequestCodeDto) {
    return this.authService.requestWaitCode({
      phone: body.phone,
      debug: body.debug,
    });
  }

  @ApiOperation({
    summary: 'Получить токены по подтверждённому flash-call',
  })
  @ApiResponse({ status: 201, type: LoginResponseDto })
  @Post('check-wait-code')
  async checkWaitCode(@Body() body: { id: string; phone: string }) {
    return this.authService.authCallWaitCode(body.id, body.phone);
  }

  @ApiOperation({ summary: 'Обновить пару refresh/JWT-токенов' })
  @ApiResponse({ status: 201, type: RefreshResponseDto })
  @Post('refresh')
  async refresh(@Body() body: RefreshDto) {
    return this.authService.refresh(body.userId, body.refresh);
  }

  @ApiOperation({ summary: 'Войти по SMS-коду' })
  @ApiResponse({ status: 201, type: LoginResponseDto })
  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.userId, body.code);
  }

  @ApiOperation({ summary: 'Проверить SMS-код' })
  @ApiResponse({ status: 200, type: Boolean })
  @Post('check-code')
  async checkCode(@Body() body: CheckCodeDto) {
    return this.authService.checkCode(body.phone, body.code);
  }

  @ApiOperation({ summary: 'Зарегистрироваться по номеру и SMS-коду' })
  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @UseGuards(AuthGuard)
  @ApiBasicAuth('JWT')
  @ApiOperation({ summary: 'Выйти' })
  @Post('sign-out')
  async signOut(
    @User('id') userId: string,
    @User('sessionId') sessionId: string,
    @Res() res: Response,
    @Req() req: Request,
    @Session() session: Record<string, any>,
  ) {
    // express-session is disabled (see main.ts), so req.session is undefined;
    // the real sign-out is the DB session revocation below. Guard the legacy
    // session write so the handler doesn't 500.
    if (session) session.tokens = null;
    if (sessionId) {
      await this.prismaService.session.update({
        where: { id: sessionId },
        data: { isRevoked: true },
      });
    }
    res.send('Sign out successfully');
  }

  @ApiOperation({ summary: 'Зарегистрировать push-устройство' })
  @Post('add-device')
  async addDevice(
    @Body('pushToken') pushToken: string,
    @Body('userId') userId: string,
    @Body('deviceId') deviceId: string,
  ) {
    if (!userId || !deviceId || !pushToken) return null;
    return this.authService.addDevice(userId, deviceId, pushToken);
  }

  // Properly authenticated account deletion. Performs Apple revoke, Saleor
  // delete, and local soft-delete in one call.
  @UseGuards(AuthGuard)
  @ApiBasicAuth('JWT')
  @ApiOperation({ summary: 'Удалить аккаунт' })
  @Delete('account')
  async deleteAccount(@User('id') userId: string) {
    await this.authService.deleteAccount(userId);
    return { ok: true };
  }

  // Legacy alias — kept for backward compatibility with current mobile build.
  // Same auth-guarded semantics as DELETE /v1/auth/account; the body userId
  // is ignored in favor of the JWT subject.
  @UseGuards(AuthGuard)
  @ApiBasicAuth('JWT')
  @ApiOperation({ summary: '[legacy] Удалить аккаунт' })
  @Post('delete-user')
  async deleteUserLegacy(@User('id') userId: string) {
    await this.authService.deleteAccount(userId);
    return { ok: true };
  }

  // ---------- Apple Sign-In ----------

  @ApiOperation({ summary: 'Issue a one-shot nonce for Sign in with Apple' })
  @Post('apple/nonce')
  async appleNonce() {
    return this.authService.appleNonce();
  }

  @ApiOperation({
    summary: 'Complete Sign in with Apple — verify identityToken & sign user in',
  })
  @ApiResponse({ status: 201, type: LoginResponseDto })
  @Post('apple')
  async appleSignIn(
    @Body()
    body: {
      identityToken: string;
      authorizationCode?: string;
      nonce: string;
      fullName?: { givenName?: string; familyName?: string };
    },
  ) {
    return this.authService.appleSignIn(body);
  }

  // ---------- Telegram / WhatsApp (legacy hash flow) ----------

  @Post('tg')
  async authTelegram() {
    return this.authService.authSocialMessenger();
  }

  @Post('whatsapp')
  async authWhatsapp(@Body() body: any) {
    return this.authService.authSocialMessenger();
  }

  @Post('whatsapp/hook')
  async authWhatsappHook(
    @Body() body: any,
    @Headers('authorization') authHeader?: string,
  ) {
    // Green API webhooks are unauthenticated by default — without this check any
    // caller who learns an auth code could inject an arbitrary phone for it and
    // then claim a session via /whatsapp/hash. Require the configured Bearer token.
    if (!this.authService.isValidWhatsappWebhookToken(authHeader)) {
      throw new UnauthorizedException();
    }

    if (body.typeWebhook !== 'incomingMessageReceived') return;

    // The client sends a human-readable message that embeds the short auth code
    // (e.g. "Подтверждаю вход в Inji. Код: ABC23456"), so pull the code out by
    // pattern instead of treating the whole message as the code.
    const text =
      body?.messageData?.textMessageData?.textMessage ||
      body?.messageData?.extendedTextMessageData?.text ||
      '';
    const hash = text.match(AUTH_CODE_RE)?.[0];
    if (!hash) return;

    const phone = body.senderData.chatId.replace('@c.us', '');
    const res = await this.prismaService.telegramAuthRequest.updateMany({
      where: { hash },
      data: { phone, data: body },
    });

    // Confirm back to the user on WhatsApp, but only when the code actually
    // matched a pending request. Best-effort — never fail the webhook on it.
    if (res?.count > 0) {
      await this.authService.sendWhatsappReply(body.senderData.chatId);
    }
    return true;
  }

  @Post('whatsapp/hash')
  async authWhatsappWithHash(@Body('hash') hash: string) {
    return this.authService.authTelegramWithHash(hash);
  }

  @Post('tg/hash')
  async authTelegramWithHash(@Body('hash') hash: string) {
    return this.authService.authTelegramWithHash(hash);
  }
}
