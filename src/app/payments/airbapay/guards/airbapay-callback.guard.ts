import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import type { Request } from 'express';

/**
 * Guards the AirbaPay server-to-server callback (/airbapay/payment-callback),
 * which creates a paid Saleor order. Without it, anyone who knows a checkout id
 * can POST {orderId, state:'confirmed'} and get a free order.
 *
 * We authenticate with a shared secret WE control: the backend embeds
 * AIRBAPAY_CALLBACK_SECRET in the callbackUrl it registers with AirbaPay (as a
 * ?token= query param) and also accepts it as a Bearer token, so the check does
 * not depend on AirbaPay's (unconfirmed) signing scheme. Fail-closed: a missing
 * secret or a wrong/absent token rejects the request.
 */
@Injectable()
export class AirbaPayCallbackGuard implements CanActivate {
  private readonly logger = new Logger(AirbaPayCallbackGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.configService.get<string>(
      'payments.airbapay.callbackSecret',
    );
    if (!expected) {
      this.logger.error('AIRBAPAY_CALLBACK_SECRET is not configured');
      throw new UnauthorizedException('Payment callback secret is not configured');
    }

    const req = context.switchToHttp().getRequest<Request>();

    const header = (req.headers['authorization'] as string) || '';
    const bearer = header.startsWith('Bearer ') ? header.slice(7) : '';
    const queryToken =
      typeof req.query?.token === 'string' ? req.query.token : '';
    const provided = queryToken || bearer;

    if (!provided || !safeEqual(provided, expected)) {
      this.logger.error(
        `Rejected AirbaPay callback with invalid token (path: ${req.originalUrl})`,
      );
      throw new UnauthorizedException('Invalid payment callback token');
    }

    return true;
  }
}

/** Constant-time compare to avoid leaking the secret via timing. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
