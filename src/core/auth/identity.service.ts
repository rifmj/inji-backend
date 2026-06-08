import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthProvider, User } from '@prisma/client';
import { nanoid } from 'nanoid';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

import { PrismaService } from '../prisma/prisma.service';
import { SaleorAuthService } from './saleor-auth.service';
import { encryptSecret, generateSaleorPassword } from '../utils/crypto';

export interface IdentityProfile {
  phone?: string;
  email?: string;
  name?: string;
  rawData?: Record<string, any>;
}

export interface SessionResponse {
  userId: string;
  sessionId: string;
  token: string;
  refresh: string;
  shopToken: string;
  shopRefreshToken: string;
  shopCsrfToken: string;
}

// Provider-agnostic identity & session core. Every login flow (phone, Apple,
// future Google/etc) ends here:
//   resolveUserByIdentity(provider, subject, profile?) → User
//   issueSession(user) → tokens
//
// No Saleor specifics, no Apple specifics, no SMS. Just the contract:
// "given an external identity, produce a User; given a User, mint a session."
@Injectable()
export class IdentityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly saleor: SaleorAuthService,
    private readonly configService: ConfigService,
  ) {}

  // Returns the User for (provider, subject), creating one (with Saleor account
  // and AuthIdentity) on first sight. Idempotent under concurrent calls.
  async resolveUserByIdentity(
    provider: AuthProvider,
    subject: string,
    profile?: IdentityProfile,
  ): Promise<User> {
    const existing = await this.findUserByIdentity(provider, subject);
    if (existing) {
      this.assertUserActive(existing);
      // Best-effort enrichment from latest provider profile (Apple may give
      // email/name only on first sign-in; if we missed it, fill once now).
      await this.enrichUserFromProfile(existing, profile);
      return existing;
    }
    try {
      return await this.createUserWithIdentity(provider, subject, profile);
    } catch (err) {
      // Lost the race — another concurrent request created the identity first.
      // Re-fetch and return that user.
      const racedExisting = await this.findUserByIdentity(provider, subject);
      if (racedExisting) {
        this.assertUserActive(racedExisting);
        return racedExisting;
      }
      throw err;
    }
  }

  // Add an extra identity to an existing user (e.g. "I already have a phone
  // account, now also link Apple"). Phone-user calls this after Apple sign-in
  // when client opts to merge instead of starting fresh.
  async linkIdentity(
    userId: string,
    provider: AuthProvider,
    subject: string,
    profile?: IdentityProfile,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    this.assertUserActive(user);
    await this.prisma.authIdentity.upsert({
      where: { provider_subject: { provider, subject } },
      create: {
        provider,
        subject,
        email: profile?.email ?? null,
        rawData: (profile?.rawData ?? null) as any,
        userId,
      },
      update: {},
    });
  }

  // Mint a session for a User: Saleor tokens + local JWT (access + refresh).
  // The user-facing response shape matches the legacy phone-auth response,
  // plus an explicit userId field.
  async issueSession(user: User): Promise<SessionResponse> {
    this.assertUserActive(user);

    const saleorTokens = await this.saleor.issueTokens(user);

    const session = await this.prisma.session.create({
      data: { userId: user.id },
    });

    const token = this.signJwt(session.id, 7);
    const refresh = this.signJwt(session.id, 30);

    const hashedRefreshToken = await bcrypt.hash(refresh, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { hashedRefreshToken },
    });

    return {
      userId: user.id,
      sessionId: session.id,
      token,
      refresh,
      shopToken: saleorTokens.token,
      shopRefreshToken: saleorTokens.refreshToken,
      shopCsrfToken: saleorTokens.csrfToken,
    };
  }

  private async findUserByIdentity(
    provider: AuthProvider,
    subject: string,
  ): Promise<User | null> {
    const identity = await this.prisma.authIdentity.findUnique({
      where: { provider_subject: { provider, subject } },
      include: { user: true },
    });
    return identity?.user ?? null;
  }

  private assertUserActive(user: User): void {
    if (user.isDeleted) {
      throw new ForbiddenException('Account was deleted');
    }
    if (user.isBanned) {
      throw new ForbiddenException('Account is banned');
    }
    if (!user.isActive) {
      throw new ForbiddenException('Account is inactive');
    }
  }

  private async enrichUserFromProfile(
    user: User,
    profile?: IdentityProfile,
  ): Promise<void> {
    if (!profile) return;
    const patch: Record<string, string> = {};
    if (!user.phone && profile.phone) patch.phone = profile.phone;
    if (!user.email && profile.email) patch.email = profile.email;
    if (!user.name && profile.name) patch.name = profile.name;
    if (Object.keys(patch).length === 0) return;
    try {
      await this.prisma.user.update({ where: { id: user.id }, data: patch });
    } catch {
      // Likely a unique-phone collision; ignore — manual linking handles it.
    }
  }

  private async createUserWithIdentity(
    provider: AuthProvider,
    subject: string,
    profile?: IdentityProfile,
  ): Promise<User> {
    const encryptionKey = this.configService.get('secrets.encryptionKey');
    const userId = nanoid(16);
    const saleorEmail = SaleorAuthService.buildSaleorEmail(userId);
    const saleorPasswordEnc = encryptSecret(
      generateSaleorPassword(),
      encryptionKey,
    );

    // Saleor first — if Saleor refuses we don't pollute our DB.
    // provisionAccount is idempotent: a leftover Saleor account from a prior
    // crash is treated as success.
    await this.saleor.provisionAccount({
      id: userId,
      saleorEmail,
      saleorPasswordEnc,
    } as User);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          id: userId,
          saleorEmail,
          saleorPasswordEnc,
          phone: profile?.phone ?? null,
          email: profile?.email ?? null,
          name: profile?.name ?? null,
        },
      });
      await tx.authIdentity.create({
        data: {
          provider,
          subject,
          email: profile?.email ?? null,
          rawData: (profile?.rawData ?? null) as any,
          userId: user.id,
        },
      });
      return user;
    });
  }

  private signJwt(sessionId: string, expDays: number): string {
    const today = new Date();
    const exp = new Date(today);
    exp.setDate(today.getDate() + expDays);
    return jwt.sign(
      { sessionId, exp: exp.getTime() / 1000 },
      process.env.JWT_SECRET,
    );
  }
}
