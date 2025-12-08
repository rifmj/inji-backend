import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { getNowUtcDate } from '../../../core/utils/date';

const { SMSC_USERNAME, SMSC_PASSWORD, SMSC_BASE_URL } = process.env;

type ErrorFlashCodeResponse = {
  error: string;
  error_code: number;
  id: number;
};

type SuccessFlashCodeResponse = {
  id: number;
  cnt: number;
  code: string;
};

type SuccessWaitCodeResponse = {
  phone: string;
};

@Injectable()
export class SmsService {
  constructor(
    private httpService: HttpService,
    private prismaService: PrismaService,
  ) {}

  checkIfTestNumber(phone: string) {
    if (phone === '+77051234567') {
      return '1234';
    }
    return null;
  }

  async sendFlashCode(phone: string): Promise<string | null> {
    console.info('is test number', phone, this.checkIfTestNumber(phone));
    if (this.checkIfTestNumber(phone)) return this.checkIfTestNumber(phone);
    const result = await this.httpService
      .post<ErrorFlashCodeResponse | SuccessFlashCodeResponse>(
        `${SMSC_BASE_URL}/sys/send.php?login=${SMSC_USERNAME}&psw=${SMSC_PASSWORD}&phones=${phone}&mes=code&call=1&fmt=3`,
      )
      .toPromise();
    if ('error' in result.data) {
      console.info('Error send', phone, result);
      return null;
    } else {
      return result.data.code?.slice(2, 6);
    }
  }

  async sendSmsCode(phone: string): Promise<string | null> {
    if (this.checkIfTestNumber(phone)) return this.checkIfTestNumber(phone);
    const smsCode = Math.floor(1000 + Math.random() * 9000).toString();
    const result = await this.httpService
      .post<ErrorFlashCodeResponse | SuccessFlashCodeResponse>(
        `${SMSC_BASE_URL}/sys/send.php?login=${SMSC_USERNAME}&psw=${SMSC_PASSWORD}&phones=${phone}&mes=${encodeURIComponent(
          'Ваш код для входа в inji: ' + smsCode,
        )}`,
      )
      .toPromise();
    console.info('SEND_SMS_CODE', result.data);
    return smsCode;
  }

  async sendWaitCode(
    phone: string,
  ): Promise<{ id: string; phone: string } | null> {
    const expiresAt = getNowUtcDate();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    console.info('is test number', phone, this.checkIfTestNumber(phone));

    if (this.checkIfTestNumber(phone)) {
      const code = await this.prismaService.callWaitCode.create({
        data: {
          userPhone: phone.replace('+', ''),
          phone: phone.replace('+', ''),
          isConfirmed: true,
          createdAt: getNowUtcDate(),
          expiresAt,
        },
      });
      return {
        id: code.id,
        phone,
      };
    }

    const waitCode = await this.prismaService.callWaitCode.findFirst({
      where: {
        userPhone: phone,
        isConfirmed: false,
        expiresAt: {
          gte: getNowUtcDate(),
        },
      },
    });

    if (waitCode?.id) {
      return {
        id: waitCode.id,
        phone: waitCode.phone,
      };
    }

    const result = await this.httpService
      .post<SuccessWaitCodeResponse>(
        `${SMSC_BASE_URL}/sys/wait_call.php?login=${SMSC_USERNAME}&psw=${SMSC_PASSWORD}&phone=${phone}&fmt=3`,
      )
      .toPromise();
    console.info('sendWaitCode:smsc:result', result.data);
    const callWaitCode = await this.prismaService.callWaitCode.create({
      data: {
        userPhone: phone.replace('+', ''),
        phone: result.data.phone,
        createdAt: getNowUtcDate(),
        expiresAt,
      },
    });
    console.info('SEND_WAIT_CODE', result.data);
    return {
      id: callWaitCode.id,
      phone: result.data.phone,
    };
  }
}
