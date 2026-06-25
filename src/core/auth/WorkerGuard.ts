import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';

/**
 * Guards machine-to-machine endpoints (the kaspi-automation worker) with a
 * shared bearer token from process.env.KASPI_WORKER_TOKEN. Kept separate from
 * AuthGuard, which is for user sessions — the worker has no user.
 */
@Injectable()
export class WorkerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.KASPI_WORKER_TOKEN;
    if (!expected) {
      throw new UnauthorizedException('KASPI_WORKER_TOKEN is not configured');
    }

    const header: string =
      context.switchToHttp().getRequest().headers?.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';

    if (token && safeEqual(token, expected)) {
      return true;
    }
    throw new UnauthorizedException();
  }
}

/** Constant-time string compare to avoid leaking the token via timing. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
