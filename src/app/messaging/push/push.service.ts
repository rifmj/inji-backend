import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import admin, { messaging } from 'firebase-admin';

import { LoggerService } from '../../../core/shared/logger.service';
import { PrismaService } from '../../../core/prisma/prisma.service';
import MessagingPayload = messaging.MessagingPayload;

const notificationOptions = {
  priority: 'high',
  timeToLive: 60 * 60 * 24,
};

const serviceAccount = require('../../../../private/firebase/inji-d25d8-firebase-adminsdk-np61c-6a34e73025.json');

/**
 * Руководство по пушам:
 * https://firebase.google.com/docs/cloud-messaging/send-message
 */
@Injectable()
export class PushService {
  constructor(
    private loggerService: LoggerService,
    private prismaService: PrismaService,
  ) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log(`Firebase app initialized`);
  }
  //TODO - Подумать, как использовать одну инстанс firebase_app

  async sendToDevice(token: string, payload: MessagingPayload) {
    try {
      const message = await admin
        .messaging()
        .sendToDevice(token, payload, notificationOptions);
      Logger.log(`Push message sent: ${JSON.stringify(message)}`);
      return message;
    } catch (e) {
      Logger.error(`Error sending to device: ${e} \
        tokens=${JSON.stringify(token)}, payload=${JSON.stringify(payload)}`);
    }
  }

  async sendToDevices(tokens: string[], payload: MessagingPayload) {
    console.info('tok', tokens, payload);
    if (!tokens?.length) {
      return;
    }
    try {
      const pushes = [];
      for (const token of tokens) {
        pushes.push(this.trySendPush(token, payload));
      }
      await Promise.all(pushes);
      Logger.log(`Push messages sent ${JSON.stringify({ tokens, pushes })}`);
    } catch (e) {
      Logger.error(`Error sending to devices: ${e} \
        tokens=${JSON.stringify(tokens)}, payload=${JSON.stringify(payload)}`);
    }
  }

  private async trySendPush(
    token: string,
    payload: MessagingPayload,
  ): Promise<void> {
    try {
      await admin.messaging().send({
        token,
        notification: payload.notification,
        data: payload.data,
        fcmOptions: {
          analyticsLabel: payload.data?.type,
        },
      });
    } catch (e) {
      this.loggerService.info(
        `Error sending to devices: ${e}, token=${token}, payload=${JSON.stringify(
          payload,
        )}`,
        'push-service',
      );
    }
  }

  async sendToUser(userId: string, payload: MessagingPayload) {
    if (!userId) {
      throw new NotFoundException();
    }
    const userDevice = await this.prismaService.userDevice.findFirst({
      where: {
        userId,
        isRevoked: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    if (!userDevice || !userDevice.pushToken) {
      console.error('Not found device', userId);
      return;
    }
    return this.sendToDevices([userDevice.pushToken], payload);
  }
}
