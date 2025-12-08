import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
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
import { GraphQLClient } from 'graphql-request';
import {
  MutationAccountRegisterDocument,
  MutationTokenCreateDocument,
} from './auth.graphql';
import { getNowUtcDate } from '../utils/date';
import { SmsService } from '../../app/messaging/sms/sms.service';

import { nanoid } from 'nanoid';
import bcrypt = require('bcrypt');
import jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;

const client = new GraphQLClient(process.env.GRAPHQL_CLIENT_URL, {
  headers: {
    authorization: 'QDLajeCWbdgo4lQ69LRj8H2EsqU46J',
  },
});

const cyrb53 = function (str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

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
  ) {}

  async onModuleInit() {
    const { codeSalt } = this.configService.get('sms');
    assertParamExists('sms.codeSalt', codeSalt);
    this.smsCodeSalt = codeSalt;
  }

  async login(userId: string, code: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (user.isDeleted) {
      throw new UnauthorizedException();
    }
    if (user?.id) {
      const hashSmsCode = await bcrypt.hash(code, this.smsCodeSalt);
      const validSmsRequestCode =
        await this.prismaService.smsRequestCode.findFirst({
          where: {
            value: hashSmsCode,
            expiresAt: {
              gt: getNowUtcDate(),
            },
          },
        });

      if (validSmsRequestCode) {
        const tokenCreateReq = await client.request(
          MutationTokenCreateDocument,
          {
            email: `c${user.phone}@inji.kz`,
            password: `c${user.phone}@inji.kz`,
          },
        );

        console.info('TokenCreateReq', JSON.stringify(tokenCreateReq, null, 2));

        if (!tokenCreateReq?.tokenCreate?.token) {
          throw new UnauthorizedException();
        }

        const session = await this.prismaService.session.create({
          data: {
            user: {
              connect: { id: user.id },
            },
          },
        });
        const userRO = this.buildUserRO(
          {
            sessionId: session.id,
          },
          {
            userId: user.id,
          },
        );
        await this.userService.setCurrentRefreshToken(userRO.refresh, userId);
        return {
          ...userRO,
          shopToken: tokenCreateReq?.tokenCreate?.token,
          shopCsrfToken: tokenCreateReq?.tokenCreate?.csrfToken,
          shopRefreshToken: tokenCreateReq?.tokenCreate?.refreshToken,
        };
      }
      throw new UnauthorizedException();
    }
    throw new UnauthorizedException();
  }

  async getAuthorizedRequestUserFromBearer(req: any) {
    const authToken = req.headers.authorization;
    if (!authToken) {
      return null;
    }
    const [bearer, jwt] = authToken.split(' ');
    if (bearer !== 'Bearer' || !jwt) {
      return null;
    }
    return this.validateToken(jwt);
  }

  async getAuthorizedRequestUser(req: any) {
    const authData = await this.getAuthorizedRequestUserFromBearer(req);
    if (authData?.sessionId) {
      return this.userService.getUserForRequest(authData);
    }
    return null;
  }

  async refresh(userId: string, refresh: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
    });
    const isRefreshTokenMatching = await bcrypt.compare(
      refresh,
      user.hashedRefreshToken,
    );
    if (user?.id && isRefreshTokenMatching) {
      const sessions = await this.prismaService.session.findMany({
        where: {
          userId: user.id,
        },
      });
      const userRO = this.buildUserRO(
        {
          sessionId: sessions[0].id,
        },
        {
          userId: user.id,
        },
      );
      await this.userService.setCurrentRefreshToken(userRO.refresh, userId);
      return userRO;
    }
    throw new UnauthorizedException();
  }

  validateToken(jwt: string) {
    try {
      const isValid = this.jwtService.verify(jwt);
      return isValid;
    } catch (e) {
      throw new UnauthorizedException();
    }
  }

  public generateJWT(
    { sessionId }: { sessionId: string },
    { userId }: { userId: string },
    expDays: number,
  ) {
    const today = new Date();
    const exp = new Date(today);
    exp.setDate(today.getDate() + expDays);

    return jwt.sign(
      {
        sessionId,
        exp: exp.getTime() / 1000,
      },
      SECRET,
    );
  }

  private buildUserRO(
    { sessionId }: { sessionId: string },
    { userId }: { userId: string },
  ) {
    const userRO = {
      token: this.generateJWT({ sessionId }, { userId }, 7),
      refresh: this.generateJWT({ sessionId }, { userId }, 30),
    };
    return userRO;
  }

  async deleteUser(userId: string) {
    this.loggerService.d(LogCtx.Auth, 'DeleteUser', { userId });
    return this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        isDeleted: true,
      },
    });
  }

  async addDevice(userId: string, deviceId: string, pushToken: string) {
    this.loggerService.d(LogCtx.Auth, 'AddDevice', {
      userId,
      deviceId,
      pushToken,
    });
    const exist = await this.prismaService.userDevice.findFirst({
      where: {
        userId,
        deviceId,
        isRevoked: false,
      },
    });
    if (!exist) {
      return this.prismaService.userDevice.create({
        data: {
          userId,
          deviceId,
          pushToken,
        },
      });
    } else {
      if (exist.pushToken === pushToken) {
        return exist;
      }
      await this.prismaService.userDevice.update({
        data: {
          isRevoked: true,
        },
        where: {
          id: exist.id,
        },
      });
      const userDevice = await this.prismaService.userDevice.create({
        data: {
          userId,
          deviceId,
          pushToken,
        },
      });
      return userDevice;
    }
  }

  async requestCode({ phone, debug }: { phone: string; debug?: boolean }) {
    const nowUtcDate = getNowUtcDate();
    const oneHourAgo = getNowUtcDate();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    this.loggerService.info(
      {
        type: 'requestCode:start',
        phone,
        nowUtcDate,
        oneHourAgo,
      },
      LogCtx.Auth,
    );

    const smsRequestCode = await this.prismaService.smsRequestCode.findFirst({
      where: {
        phone,
        expiresAt: {
          gt: nowUtcDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const smsRequestCodesOneHourAgo =
      await this.prismaService.smsRequestCode.findMany({
        where: {
          phone,
          createdAt: {
            gte: oneHourAgo,
          },
        },
      });

    this.loggerService.info(
      {
        type: 'requestCode:code',
        phone,
        debug,
        smsRequestCode,
        smsRequestCodesOneHourAgo,
      },
      LogCtx.Auth,
    );

    const smsCode = await this.smsService.sendSmsCode(`+7${phone}`);

    if (!smsCode) {
      throw new UnauthorizedException();
    }

    const hash = await bcrypt.hash(smsCode, this.smsCodeSalt);

    const expiresAt = getNowUtcDate();
    expiresAt.setMinutes(expiresAt.getMinutes() + 2);

    await this.prismaService.smsRequestCode.create({
      data: {
        value: hash,
        phone,
        expiresAt,
        createdAt: nowUtcDate,
      },
    });

    this.loggerService.info(
      {
        type: 'requestCode:sent',
        phone,
        hash,
        smsCode,
        expiresAt,
      },
      LogCtx.Auth,
    );

    const user = await this.prismaService.user.findUnique({
      where: {
        phone,
      },
    });

    return {
      userId: user?.id || null,
    };
  }

  async requestWaitCode({ phone, debug }: { phone: string; debug?: boolean }) {
    const nowUtcDate = getNowUtcDate();
    const oneHourAgo = getNowUtcDate();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    this.loggerService.info(
      {
        type: 'requestCode:start',
        phone,
        nowUtcDate,
        oneHourAgo,
      },
      LogCtx.Auth,
    );

    const smsRequestCode = await this.prismaService.smsRequestCode.findFirst({
      where: {
        phone,
        expiresAt: {
          gt: nowUtcDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const smsRequestCodesOneHourAgo =
      await this.prismaService.smsRequestCode.findMany({
        where: {
          phone,
          createdAt: {
            gte: oneHourAgo,
          },
        },
      });

    this.loggerService.info(
      {
        type: 'requestCode:code',
        phone,
        debug,
        smsRequestCode,
        smsRequestCodesOneHourAgo,
      },
      LogCtx.Auth,
    );

    const waitCode = await this.smsService.sendWaitCode(`+7${phone}`);

    this.loggerService.info(
      {
        type: 'waitCode:sent',
        phone,
        waitCode,
      },
      LogCtx.Auth,
    );

    return waitCode;
  }

  async checkCode(phone: string, code: string) {
    const nowUtcDate = getNowUtcDate();
    const hash = await bcrypt.hash(code, this.smsCodeSalt);
    const smsRequestCode = await this.prismaService.smsRequestCode.findFirst({
      where: {
        phone: phone,
        value: hash,
        expiresAt: {
          gt: nowUtcDate,
        },
      },
    });
    if (!smsRequestCode) {
      return false;
    }
    return true;
  }

  async register(body: RegisterDto) {
    this.loggerService.info(
      {
        type: 'register:start',
        phone: body.phone,
        body,
      },
      LogCtx.Auth,
    );

    const user = await this.prismaService.user.findUnique({
      where: {
        phone: body.phone,
      },
    });

    this.loggerService.info(
      {
        type: 'register:user',
        phone: body.phone,
        user,
      },
      LogCtx.Auth,
    );

    if (user?.isDeleted) {
      throw new NotAcceptableException('Аккаунт был удален');
    }

    if (user?.id) {
      throw new ForbiddenException(
        'Пользователь с таким телефоном уже зарегистрирован',
      );
    }

    const hashSmsCode = await bcrypt.hash(body.code, this.smsCodeSalt);
    const validSmsRequestCode =
      await this.prismaService.smsRequestCode.findFirst({
        where: {
          value: hashSmsCode,
          expiresAt: {
            gt: getNowUtcDate(),
          },
        },
      });

    this.loggerService.info(
      {
        type: 'register:hash',
        phone: body.phone,
        code: body.code,
        hashSmsCode,
        validSmsRequestCode,
      },
      LogCtx.Auth,
    );

    if (!validSmsRequestCode) {
      throw new UnauthorizedException(
        'Неверный код доступа или время жизни кода истекло',
      );
    }

    const saleorUser = await client.request(MutationAccountRegisterDocument, {
      email: `c${body.phone}@inji.kz`,
      password: `c${body.phone}@inji.kz`,
      channel: 'mobile',
      redirectUrl: 'https://core.inji.kz',
    });

    this.loggerService.info(
      {
        type: 'register:saleor-user-create',
        saleorUser,
        phone: body.phone,
      },
      LogCtx.Auth,
    );

    if (!saleorUser?.accountRegister?.user?.email) {
      throw new NotAcceptableException();
    }

    const createdUser = await this.prismaService.user.create({
      data: {
        id: nanoid(16),
        phone: body.phone,
      },
    });

    this.loggerService.info(
      {
        type: 'register:user-create',
        createdUser,
        phone: body.phone,
      },
      LogCtx.Auth,
    );

    const tokenCreateReq = await client.request(MutationTokenCreateDocument, {
      email: `c${createdUser.phone}@inji.kz`,
      password: `c${createdUser.phone}@inji.kz`,
    });

    if (!tokenCreateReq?.tokenCreate?.token) {
      throw new UnauthorizedException();
    }

    const session = await this.prismaService.session.create({
      data: {
        user: {
          connect: { id: createdUser.id },
        },
      },
    });

    const userRO = this.buildUserRO(
      {
        sessionId: session.id,
      },
      {
        userId: createdUser.id,
      },
    );

    await this.userService.setCurrentRefreshToken(
      userRO.refresh,
      createdUser.id,
    );

    return {
      ...userRO,
      shopToken: tokenCreateReq?.tokenCreate?.token,
      shopCsrfToken: tokenCreateReq?.tokenCreate?.csrfToken,
      shopRefreshToken: tokenCreateReq?.tokenCreate?.refreshToken,
    };
  }

  /**
   * Авторизация через мессенджеры
   */

  public async authSocialMessenger() {
    const data = await this.prismaService.telegramAuthRequest.create({
      data: {
        hash: nanoid(32),
      },
    });
    return {
      hash: data.hash,
    };
  }

  public async authTelegramWithHash(hash: string) {
    const data = await this.prismaService.telegramAuthRequest.findFirst({
      where: { hash },
    });
    if (!data || data.hash !== hash) {
      throw new UnauthorizedException();
    }
    if (!data?.phone) {
      return;
    }
    const phone = data.phone?.slice(-10);
    if (phone) {
      return this.authUserByPhone(phone);
    }
  }

  public async authCallWaitCode(id: string, phone: string) {
    const data = await this.prismaService.callWaitCode.findFirst({
      where: { id, userPhone: phone },
    });
    console.info('!!', id, phone, data);
    if (!data?.phone || !data.isConfirmed) {
      throw new UnauthorizedException();
    }
    const userPhone = data.userPhone?.slice(-10);
    if (userPhone) {
      return this.authUserByPhone(userPhone);
    }
  }

  public async authUserByPhone(phone: string) {
    /**
     * Получаем информацию о пользователе по номеру телефона
     */
    const user = await this.prismaService.user.findFirst({
      where: {
        phone,
      },
    });
    /**
     *
     * Если пользователь зарегистрирован
     */
    if (user?.id) {
      const tokenCreateReq = await client.request(MutationTokenCreateDocument, {
        email: `c${user.phone}@inji.kz`,
        password: `c${user.phone}@inji.kz`,
      });

      if (!tokenCreateReq?.tokenCreate?.token) {
        throw new UnauthorizedException();
      }

      const session = await this.prismaService.session.create({
        data: {
          user: {
            connect: { id: user.id },
          },
        },
      });

      const userRO = this.buildUserRO(
        {
          sessionId: session.id,
        },
        {
          userId: user.id,
        },
      );

      await this.userService.setCurrentRefreshToken(userRO.refresh, user.id);

      return {
        ...userRO,
        shopToken: tokenCreateReq?.tokenCreate?.token,
        shopCsrfToken: tokenCreateReq?.tokenCreate?.csrfToken,
        shopRefreshToken: tokenCreateReq?.tokenCreate?.refreshToken,
      };
    } else {
      /**
       * Если пользователь не зарегистрирован
       */
      console.info('mUst regitser user', phone);
      const saleorUser = await client.request(MutationAccountRegisterDocument, {
        email: `c${phone}@inji.kz`,
        password: `c${phone}@inji.kz`,
        channel: 'default-channel',
        redirectUrl: 'https://core.inji.kz',
      });

      console.info('regiter request', saleorUser.accountRegister.accountErrors);

      if (!saleorUser?.accountRegister?.user?.email) {
        throw new NotAcceptableException();
      }

      const createdUser = await this.prismaService.user.create({
        data: {
          id: nanoid(16),
          phone,
        },
      });

      const tokenCreateReq = await client.request(MutationTokenCreateDocument, {
        email: `c${createdUser.phone}@inji.kz`,
        password: `c${createdUser.phone}@inji.kz`,
      });

      if (!tokenCreateReq?.tokenCreate?.token) {
        throw new UnauthorizedException();
      }

      const session = await this.prismaService.session.create({
        data: {
          user: {
            connect: { id: createdUser.id },
          },
        },
      });

      const userRO = this.buildUserRO(
        {
          sessionId: session.id,
        },
        {
          userId: createdUser.id,
        },
      );

      await this.userService.setCurrentRefreshToken(
        userRO.refresh,
        createdUser.id,
      );

      return {
        ...userRO,
        shopToken: tokenCreateReq?.tokenCreate?.token,
        shopCsrfToken: tokenCreateReq?.tokenCreate?.csrfToken,
        shopRefreshToken: tokenCreateReq?.tokenCreate?.refreshToken,
      };
    }
  }
}
