import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  Res,
  Session,
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
    description: `Отправляет код доступа на номер телефона пользователя. 
      В ответ приходит объект с полем userId (если пользователь уже зарегистрирован), либо null (если у пользователя еще нет профиля).`,
  })
  @ApiResponse({
    status: 201,
    description:
      'Объект с идентификатором пользователя userId, кодом доступа smsCode и флагом удаления',
  })
  @Post('request-code')
  async requestCode(@Body() body: RequestCodeDto) {
    return this.authService.requestCode({
      phone: body.phone,
      debug: body.debug,
    });
  }

  @ApiOperation({
    summary: 'Запросить код доступа по номеру мобильного телефона',
    description: `Отправляет код доступа на номер телефона пользователя. 
      В ответ приходит объект с полем userId (если пользователь уже зарегистрирован), либо null (если у пользователя еще нет профиля).`,
  })
  @ApiResponse({
    status: 201,
    description:
      'Объект с идентификатором пользователя userId, кодом доступа smsCode и флагом удаления',
  })
  @Post('request-wait-code')
  async requestWaitCode(@Body() body: RequestCodeDto) {
    return this.authService.requestWaitCode({
      phone: body.phone,
      debug: body.debug,
    });
  }

  @ApiOperation({
    summary: 'Получить токены по идентификатору пользователя и коду доступа',
  })
  @ApiResponse({
    status: 201,
    type: LoginResponseDto,
    description: 'Объект с JWT-токеном (access) и Refresh-токеном',
  })
  @Post('check-wait-code')
  async checkWaitCode(@Body() body: { id: string; phone: string }) {
    return this.authService.authCallWaitCode(body.id, body.phone);
  }

  @ApiOperation({
    summary:
      'Получить новые Refresh и JWT-токены по имеющимся Refresh-токену и userId',
  })
  @ApiResponse({
    status: 201,
    type: RefreshResponseDto,
    description: 'Объект с JWT-токеном (access) и Refresh-токеном',
  })
  @Post('refresh')
  async refresh(@Body() body: RefreshDto) {
    return this.authService.refresh(body.userId, body.refresh);
  }

  @ApiOperation({
    summary: 'Получить токены по идентификатору пользователя и коду доступа',
  })
  @ApiResponse({
    status: 201,
    type: LoginResponseDto,
    description: 'Объект с JWT-токеном (access) и Refresh-токеном',
  })
  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.userId, body.code);
  }

  @ApiOperation({
    summary: 'Проверить код авторизации из смс',
  })
  @ApiResponse({
    status: 200,
    type: Boolean,
    description: 'Если ответ true - код верный',
  })
  @Post('check-code')
  async checkCode(@Body() body: CheckCodeDto) {
    return this.authService.checkCode(body.phone, body.code);
  }

  @ApiOperation({
    summary: 'Зарегистрироваться',
  })
  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @UseGuards(AuthGuard)
  @ApiBasicAuth('JWT')
  @ApiOperation({
    summary: 'Выйти',
  })
  @Post('sign-out')
  async signOut(
    @User('id') userId: string,
    @User('accountId') accountId: string,
    @User('sessionId') sessionId: string,
    @Res() res: Response,
    @Req() req: Request,
    @Session() session: Record<string, any>,
  ) {
    session.tokens = null;
    res.send('Sign out successfully');
  }

  @ApiOperation({
    summary: 'Добавить устройство',
  })
  @Post('add-device')
  async addDevice(
    @Body('pushToken') pushToken: string,
    @Body('userId') userId: string,
    @Body('deviceId') deviceId: string,
  ) {
    console.info('addDevice:pushToken', { pushToken, userId, deviceId });
    if (!userId || !deviceId || !pushToken) {
      return null;
    }
    return this.authService.addDevice(userId, deviceId, pushToken);
  }

  @ApiOperation({
    summary: 'Удалить пользователя',
  })
  @Post('delete-user')
  async deleteUser(@Body('userId') userId: string) {
    return this.authService.deleteUser(userId);
  }

  @Post('tg')
  async authTelegram() {
    return this.authService.authSocialMessenger();
  }

  @Post('whatsapp')
  async authWhatsapp(@Body() body: any) {
    return this.authService.authSocialMessenger();
  }

  @Post('whatsapp/hook')
  async authWhatsappHook(@Body() body: any) {
    if (body.typeWebhook !== 'incomingMessageReceived') {
      return;
    }

    const hash = (
      body?.messageData?.textMessageData?.textMessage ||
      body?.messageData?.extendedTextMessageData?.text ||
      ''
    ).trim();

    console.info('ha, hash', hash, hash.length);

    if (hash.length !== 32) {
      return;
    }

    const phone = body.senderData.chatId.replace('@c.us', '');
    await this.prismaService.telegramAuthRequest.updateMany({
      where: {
        hash,
      },
      data: {
        phone: phone,
        data: body,
      },
    });
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
