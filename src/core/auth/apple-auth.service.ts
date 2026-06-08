import { createHash, randomBytes } from 'crypto';
import {
  BadRequestException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createRemoteJWKSet,
  importPKCS8,
  jwtVerify,
  SignJWT,
  type JWTPayload,
} from 'jose';

import { PrismaService } from '../prisma/prisma.service';
import { IdentityService, SessionResponse } from './identity.service';
import { encryptSecret } from '../utils/crypto';

const APPLE_ISSUER = 'https://appleid.apple.com';
const APPLE_JWKS_URL = `${APPLE_ISSUER}/auth/keys`;
const APPLE_TOKEN_URL = `${APPLE_ISSUER}/auth/token`;
const APPLE_REVOKE_URL = `${APPLE_ISSUER}/auth/revoke`;

interface AppleConfig {
  bundleId?: string;
  teamId?: string;
  keyId?: string;
  privateKey?: string;
  keyConfigured: boolean;
  nonceTtlSeconds: number;
}

interface AppleSignInPayload {
  identityToken: string;
  authorizationCode?: string;
  // Raw nonce that the server issued. Client hashes it via the Apple SDK
  // before submission, but we still receive the raw value here so we can
  // (a) match it against our nonce table and (b) recompute SHA-256 to compare
  // against the `nonce` claim inside the identityToken.
  nonce: string;
  fullName?: { givenName?: string; familyName?: string };
}

interface AppleIdentityClaims extends JWTPayload {
  email?: string;
  email_verified?: boolean | string;
  is_private_email?: boolean | string;
  nonce?: string;
  nonce_supported?: boolean;
}

interface AppleTokenResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}

// Sign in with Apple — server-side counterpart.
//
// Flow:
//   1) POST /v1/auth/apple/nonce → issue a one-shot nonce.
//   2) Client passes the raw nonce to AppleAuthentication.signInAsync, which
//      sends SHA-256(nonce) to Apple. Apple echoes that hash inside the JWT's
//      `nonce` claim.
//   3) POST /v1/auth/apple { identityToken, authorizationCode, nonce, fullName? }
//      We verify the JWT, match the nonce, resolve the user, mint a session,
//      and (if Apple keys are configured) trade the authorizationCode for a
//      refresh token so we can later revoke the grant on account deletion.
@Injectable()
export class AppleAuthService implements OnModuleInit {
  private cfg!: AppleConfig;
  private encryptionKey!: string;
  private jwks!: ReturnType<typeof createRemoteJWKSet>;
  private clientSecret?: { value: string; expiresAt: number };
  private privateKeyP8?: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly identityService: IdentityService,
  ) {}

  onModuleInit() {
    this.cfg = this.configService.get<AppleConfig>('apple');
    this.encryptionKey = this.configService.get<string>(
      'secrets.encryptionKey',
    );
    this.jwks = createRemoteJWKSet(new URL(APPLE_JWKS_URL), {
      cacheMaxAge: 24 * 60 * 60 * 1000,
      cooldownDuration: 30 * 1000,
    });
  }

  async issueNonce(): Promise<{ nonce: string }> {
    const nonce = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + this.cfg.nonceTtlSeconds * 1000);
    await this.prisma.appleAuthNonce.create({ data: { nonce, expiresAt } });
    return { nonce };
  }

  async signIn(payload: AppleSignInPayload): Promise<SessionResponse> {
    if (!this.cfg.bundleId) {
      throw new BadRequestException(
        'Sign in with Apple is not configured: APPLE_BUNDLE_ID is missing',
      );
    }
    if (!payload?.identityToken || !payload?.nonce) {
      throw new BadRequestException('identityToken and nonce are required');
    }

    await this.consumeNonce(payload.nonce);

    const claims = await this.verifyIdentityToken(payload.identityToken);

    const expectedHashedNonce = createHash('sha256')
      .update(payload.nonce)
      .digest('hex');
    if (claims.nonce !== expectedHashedNonce) {
      throw new UnauthorizedException('Apple nonce mismatch');
    }

    const appleSub = claims.sub;
    if (!appleSub) {
      throw new UnauthorizedException('Apple identityToken missing sub claim');
    }

    const fullName = formatFullName(payload.fullName);
    const user = await this.identityService.resolveUserByIdentity(
      'apple',
      appleSub,
      {
        email: claims.email,
        name: fullName,
        rawData: {
          email_verified: claims.email_verified,
          is_private_email: claims.is_private_email,
        },
      },
    );

    const session = await this.identityService.issueSession(user);

    if (payload.authorizationCode && this.cfg.keyConfigured) {
      // Best-effort — don't fail sign-in if Apple's token endpoint is flaky.
      this.exchangeAndStoreRefreshToken(
        user.id,
        appleSub,
        payload.authorizationCode,
      ).catch((err) =>
        console.warn(
          'AppleAuthService.exchangeAndStoreRefreshToken failed:',
          (err as Error).message,
        ),
      );
    }

    return session;
  }

  // Called at account deletion. Revokes every refresh token we hold for the
  // user. Best-effort; missing key config or Apple errors do not block local
  // soft-delete.
  async revokeAllForUser(userId: string): Promise<void> {
    if (!this.cfg.keyConfigured) return;
    const sessions = await this.prisma.appleSession.findMany({
      where: { userId },
    });
    await Promise.allSettled(
      sessions.map(async (s) => {
        try {
          const { decryptSecret } = await import('../utils/crypto');
          const refreshToken = decryptSecret(
            s.refreshTokenEnc,
            this.encryptionKey,
          );
          await this.revokeRefreshToken(refreshToken);
        } catch (err) {
          console.warn(
            'AppleAuthService.revokeAllForUser revoke failed:',
            (err as Error).message,
          );
        }
      }),
    );
    await this.prisma.appleSession.deleteMany({ where: { userId } });
  }

  private async consumeNonce(nonce: string): Promise<void> {
    const row = await this.prisma.appleAuthNonce.findUnique({
      where: { nonce },
    });
    if (!row) {
      throw new UnauthorizedException('Unknown Apple nonce');
    }
    if (row.expiresAt < new Date()) {
      await this.prisma.appleAuthNonce.delete({ where: { nonce } });
      throw new UnauthorizedException('Apple nonce expired');
    }
    await this.prisma.appleAuthNonce.delete({ where: { nonce } });
  }

  private async verifyIdentityToken(
    token: string,
  ): Promise<AppleIdentityClaims> {
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: APPLE_ISSUER,
        audience: this.cfg.bundleId,
      });
      return payload as AppleIdentityClaims;
    } catch (err) {
      throw new UnauthorizedException(
        `Apple identityToken verification failed: ${(err as Error).message}`,
      );
    }
  }

  private async exchangeAndStoreRefreshToken(
    userId: string,
    appleSub: string,
    authorizationCode: string,
  ): Promise<void> {
    const clientSecret = await this.getClientSecret();

    const form = new URLSearchParams({
      client_id: this.cfg.bundleId!,
      client_secret: clientSecret,
      code: authorizationCode,
      grant_type: 'authorization_code',
    });

    const res = await fetch(APPLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    if (!res.ok) {
      throw new Error(`Apple /auth/token returned ${res.status}`);
    }
    const tokens = (await res.json()) as AppleTokenResponse;
    if (!tokens.refresh_token) return;

    await this.prisma.appleSession.create({
      data: {
        userId,
        appleSub,
        refreshTokenEnc: encryptSecret(
          tokens.refresh_token,
          this.encryptionKey,
        ),
      },
    });
  }

  private async revokeRefreshToken(refreshToken: string): Promise<void> {
    const clientSecret = await this.getClientSecret();
    const form = new URLSearchParams({
      client_id: this.cfg.bundleId!,
      client_secret: clientSecret,
      token: refreshToken,
      token_type_hint: 'refresh_token',
    });
    const res = await fetch(APPLE_REVOKE_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    if (!res.ok) {
      throw new Error(`Apple /auth/revoke returned ${res.status}`);
    }
  }

  // Apple's client_secret is an ES256-signed JWT, valid up to 6 months.
  // We cache for 50 minutes — long enough to amortize the sign, short enough
  // to absorb a rotated key without restart.
  private async getClientSecret(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (this.clientSecret && this.clientSecret.expiresAt - now > 60) {
      return this.clientSecret.value;
    }
    if (!this.privateKeyP8) {
      this.privateKeyP8 = await importPKCS8(this.cfg.privateKey!, 'ES256');
    }
    const expiresAt = now + 50 * 60;
    const jwtStr = await new SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: this.cfg.keyId! })
      .setIssuer(this.cfg.teamId!)
      .setIssuedAt(now)
      .setExpirationTime(expiresAt)
      .setAudience(APPLE_ISSUER)
      .setSubject(this.cfg.bundleId!)
      .sign(this.privateKeyP8);
    this.clientSecret = { value: jwtStr, expiresAt };
    return jwtStr;
  }
}

function formatFullName(input?: {
  givenName?: string;
  familyName?: string;
}): string | undefined {
  if (!input) return undefined;
  const parts = [input.givenName, input.familyName]
    .map((s) => s?.trim())
    .filter(Boolean);
  return parts.length ? parts.join(' ') : undefined;
}
