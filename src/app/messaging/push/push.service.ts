import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import admin, { messaging } from 'firebase-admin';

import { LoggerService } from '../../../core/shared/logger.service';
import { PrismaService } from '../../../core/prisma/prisma.service';
import MessagingPayload = messaging.MessagingPayload;

const notificationOptions = {
  priority: 'high',
  timeToLive: 60 * 60 * 24,
};

const LEGACY_SERVICE_ACCOUNT_PATH = join(
  __dirname,
  '../../../../private/firebase/inji-d25d8-firebase-adminsdk-np61c-6a34e73025.json',
);

function resolveFirebaseCredential():
  | ReturnType<typeof admin.credential.cert>
  | ReturnType<typeof admin.credential.applicationDefault>
  | null {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json?.trim()) {
    try {
      return admin.credential.cert(JSON.parse(json) as Record<string, unknown>);
    } catch (e) {
      Logger.warn(
        `FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON; trying other credential sources: ${e}`,
        'PushService',
      );
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (projectId && clientEmail && privateKey) {
    try {
      return admin.credential.cert({ projectId, clientEmail, privateKey });
    } catch (e) {
      Logger.warn(
        `Firebase env credential fields are invalid; trying other credential sources: ${e}`,
        'PushService',
      );
    }
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      return admin.credential.applicationDefault();
    } catch (e) {
      Logger.warn(
        `GOOGLE_APPLICATION_CREDENTIALS / applicationDefault failed: ${e}`,
        'PushService',
      );
    }
  }

  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (path && existsSync(path)) {
    try {
      const raw = readFileSync(path, 'utf8');
      return admin.credential.cert(JSON.parse(raw) as Record<string, unknown>);
    } catch (e) {
      Logger.warn(
        `Failed to read FIREBASE_SERVICE_ACCOUNT_PATH: ${e}`,
        'PushService',
      );
    }
  }

  if (existsSync(LEGACY_SERVICE_ACCOUNT_PATH)) {
    try {
      const raw = readFileSync(LEGACY_SERVICE_ACCOUNT_PATH, 'utf8');
      return admin.credential.cert(JSON.parse(raw) as Record<string, unknown>);
    } catch (e) {
      Logger.warn(
        `Failed to load legacy Firebase key file: ${e}`,
        'PushService',
      );
    }
  }

  return null;
}

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
    if ((admin.apps?.length ?? 0) > 0) {
      return;
    }
    const credential = resolveFirebaseCredential();
    if (!credential) {
      Logger.warn(
        'Firebase Admin not configured; push disabled. Set FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY, GOOGLE_APPLICATION_CREDENTIALS, FIREBASE_SERVICE_ACCOUNT_PATH, or add the legacy key file under private/firebase/.',
        'PushService',
      );
      return;
    }
    try {
      admin.initializeApp({ credential });
      Logger.log(`Firebase app initialized`, 'PushService');
    } catch (e) {
      Logger.error(
        `Firebase Admin initializeApp failed: ${e}`,
        e instanceof Error ? e.stack : '',
        'PushService',
      );
    }
  }

  private firebaseReady(): boolean {
    return (admin.apps?.length ?? 0) > 0;
  }

  async sendToDevice(token: string, payload: MessagingPayload) {
    if (!this.firebaseReady()) {
      return;
    }
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
    if (!this.firebaseReady()) {
      return;
    }
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
    if (!this.firebaseReady()) {
      return;
    }
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
