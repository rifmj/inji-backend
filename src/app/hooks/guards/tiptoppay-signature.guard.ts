import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import type { Request } from 'express';
import { LoggerService } from '../../../core/shared/logger.service';

/**
 * Verifies the HMAC signature TipTopPay (CloudPayments white-label) sends on
 * every payment notification. Without this, anyone who knows a checkout id can
 * POST to /hooks/payments/* and have the backend create a "paid" order for free.
 *
 * TipTopPay signs the exact raw request body with HMAC-SHA256 using the terminal
 * API Secret and sends the base64 result in the `Content-HMAC` header (older
 * integrations use `X-Content-HMAC`). We recompute it over req.rawBody (captured
 * by the body-parser `verify` hook in main.ts) and compare in constant time.
 *
 * Fail-closed: if the secret is not configured or the signature is missing or
 * wrong, the request is rejected. This guards money, so a misconfigured env must
 * never silently accept unsigned callbacks.
 */
@Injectable()
export class TipTopPaySignatureGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const apiSecret = this.configService.get<string>(
      'payments.tiptop.apiSecret',
    );
    if (!apiSecret) {
      this.loggerService.error(
        { status: 'tiptopSecretMissing' },
        'payments-signature',
      );
      throw new UnauthorizedException('Payment gateway secret is not configured');
    }

    const req = context
      .switchToHttp()
      .getRequest<Request & { rawBody?: Buffer }>();

    const rawBody = req.rawBody;
    if (!rawBody?.length) {
      this.loggerService.error(
        { status: 'tiptopRawBodyMissing', path: req.originalUrl },
        'payments-signature',
      );
      throw new UnauthorizedException('Missing request body signature');
    }

    const provided =
      (req.headers['content-hmac'] as string) ||
      (req.headers['x-content-hmac'] as string) ||
      '';

    const expected = createHmac('sha256', apiSecret)
      .update(rawBody)
      .digest('base64');

    if (!provided || !safeEqual(provided, expected)) {
      this.loggerService.error(
        { status: 'tiptopSignatureMismatch', path: req.originalUrl },
        'payments-signature',
      );
      throw new UnauthorizedException('Invalid payment signature');
    }

    return true;
  }
}

/** Constant-time compare to avoid leaking the expected HMAC via timing. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
