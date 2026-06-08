import {
  Injectable,
  NotAcceptableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphQLClient } from 'graphql-request';

import { User } from '@prisma/client';

import {
  MutationAccountRegisterDocument,
  MutationCustomerBulkDeleteDocument,
  MutationTokenCreateDocument,
  QueryCustomerByEmailDocument,
} from './auth.graphql';
import { decryptSecret } from '../utils/crypto';

export interface SaleorTokens {
  token: string;
  refreshToken: string;
  csrfToken: string;
}

// Single chokepoint for all Saleor account operations. The synthetic-email +
// per-user-random-password scheme is an implementation detail of this service.
// To swap Saleor's auth for an external plugin later, change ONLY this file —
// IdentityService and AppleAuthService never see Saleor.
@Injectable()
export class SaleorAuthService {
  private readonly client: GraphQLClient;
  private readonly encryptionKey: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new GraphQLClient(process.env.GRAPHQL_CLIENT_URL, {
      headers: {
        authorization: `JWT ${process.env.SALEOR_BACKEND_TOKEN}`,
      },
    });
    this.encryptionKey = this.configService.get('secrets.encryptionKey');
  }

  static buildSaleorEmail(userId: string): string {
    return `u${userId}@inji.kz`;
  }

  // Idempotent: if the Saleor account already exists, returns silently.
  async provisionAccount(user: User): Promise<void> {
    const password = decryptSecret(user.saleorPasswordEnc, this.encryptionKey);
    // redirectUrl is only consumed by Saleor when account-confirmation email is
    // enabled, and Saleor validates its host against ALLOWED_CLIENT_HOSTS. A
    // hardcoded URL (e.g. an old storefront) silently breaks signup whenever the
    // Saleor config drifts, so keep it configurable and omit it by default.
    const redirectUrl = process.env.SALEOR_ACCOUNT_REDIRECT_URL || undefined;
    const res = await this.client.request(MutationAccountRegisterDocument, {
      email: user.saleorEmail,
      password,
      channel: process.env.SALEOR_CHANNEL || 'mobile',
      redirectUrl,
    });
    const errors = res?.accountRegister?.accountErrors ?? [];
    const alreadyExists = errors.some((e: any) => e.code === 'UNIQUE');
    if (alreadyExists) {
      return;
    }
    if (!res?.accountRegister?.user?.email) {
      throw new NotAcceptableException(
        `Saleor accountRegister failed: ${JSON.stringify(errors)}`,
      );
    }
  }

  async issueTokens(user: User): Promise<SaleorTokens> {
    const password = decryptSecret(user.saleorPasswordEnc, this.encryptionKey);
    const res = await this.client.request(MutationTokenCreateDocument, {
      email: user.saleorEmail,
      password,
    });
    const token = res?.tokenCreate?.token;
    if (!token) {
      throw new UnauthorizedException('Saleor tokenCreate failed');
    }
    return {
      token,
      refreshToken: res.tokenCreate.refreshToken,
      csrfToken: res.tokenCreate.csrfToken,
    };
  }

  // Best-effort delete. Requires SALEOR_BACKEND_TOKEN with staff "delete users"
  // permission. If permission is missing, logs and continues — local
  // soft-delete still completes.
  async deleteAccount(user: User): Promise<void> {
    try {
      const lookup = await this.client.request(QueryCustomerByEmailDocument, {
        email: user.saleorEmail,
      });
      const customerId = lookup?.user?.id;
      if (!customerId) {
        return;
      }
      await this.client.request(MutationCustomerBulkDeleteDocument, {
        ids: [customerId],
      });
    } catch (err) {
      console.warn(
        'SaleorAuthService.deleteAccount failed (continuing):',
        (err as Error).message,
      );
    }
  }
}
