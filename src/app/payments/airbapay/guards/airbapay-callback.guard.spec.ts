import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AirbaPayCallbackGuard } from './airbapay-callback.guard';

const SECRET = 'airba-callback-secret';

function makeContext(opts: {
  query?: Record<string, unknown>;
  authorization?: string;
}): ExecutionContext {
  const req = {
    query: opts.query ?? {},
    headers: opts.authorization ? { authorization: opts.authorization } : {},
    originalUrl: '/airbapay/payment-callback',
  };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

function makeGuard(secret?: string): AirbaPayCallbackGuard {
  const config = {
    get: (key: string) =>
      key === 'payments.airbapay.callbackSecret' ? secret : undefined,
  } as unknown as ConfigService;
  return new AirbaPayCallbackGuard(config);
}

describe('AirbaPayCallbackGuard', () => {
  it('accepts a matching ?token= query param', () => {
    const guard = makeGuard(SECRET);
    expect(guard.canActivate(makeContext({ query: { token: SECRET } }))).toBe(
      true,
    );
  });

  it('accepts a matching Bearer token', () => {
    const guard = makeGuard(SECRET);
    expect(
      guard.canActivate(makeContext({ authorization: `Bearer ${SECRET}` })),
    ).toBe(true);
  });

  it('rejects a wrong token', () => {
    const guard = makeGuard(SECRET);
    expect(() =>
      guard.canActivate(makeContext({ query: { token: 'nope' } })),
    ).toThrow(UnauthorizedException);
  });

  it('rejects when no token is provided', () => {
    const guard = makeGuard(SECRET);
    expect(() => guard.canActivate(makeContext({}))).toThrow(
      UnauthorizedException,
    );
  });

  it('fails closed when the secret is not configured', () => {
    const guard = makeGuard(undefined);
    expect(() =>
      guard.canActivate(makeContext({ query: { token: SECRET } })),
    ).toThrow(UnauthorizedException);
  });
});
