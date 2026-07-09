import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { TipTopPaySignatureGuard } from './tiptoppay-signature.guard';

const SECRET = 'test-api-secret';

function makeContext(opts: {
  rawBody?: Buffer;
  hmac?: string;
  headerName?: 'content-hmac' | 'x-content-hmac';
}): ExecutionContext {
  const headers: Record<string, string> = {};
  if (opts.hmac !== undefined) {
    headers[opts.headerName ?? 'content-hmac'] = opts.hmac;
  }
  const req = { rawBody: opts.rawBody, headers, originalUrl: '/hooks/payments/pay' };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

function makeGuard(secret?: string): TipTopPaySignatureGuard {
  const config = {
    get: (key: string) =>
      key === 'payments.tiptop.apiSecret' ? secret : undefined,
  } as unknown as ConfigService;
  const logger = { error: jest.fn() } as any;
  return new TipTopPaySignatureGuard(config, logger);
}

const sign = (body: Buffer) =>
  createHmac('sha256', SECRET).update(body).digest('base64');

describe('TipTopPaySignatureGuard', () => {
  it('accepts a request with a valid HMAC signature', () => {
    const body = Buffer.from(JSON.stringify({ InvoiceId: 'chk_1' }));
    const guard = makeGuard(SECRET);
    expect(
      guard.canActivate(makeContext({ rawBody: body, hmac: sign(body) })),
    ).toBe(true);
  });

  it('accepts the legacy X-Content-HMAC header', () => {
    const body = Buffer.from('Amount=100&InvoiceId=chk_1');
    const guard = makeGuard(SECRET);
    expect(
      guard.canActivate(
        makeContext({
          rawBody: body,
          hmac: sign(body),
          headerName: 'x-content-hmac',
        }),
      ),
    ).toBe(true);
  });

  it('rejects a forged/mismatched signature', () => {
    const body = Buffer.from(JSON.stringify({ InvoiceId: 'chk_1' }));
    const guard = makeGuard(SECRET);
    expect(() =>
      guard.canActivate(
        makeContext({ rawBody: body, hmac: 'not-the-real-hmac' }),
      ),
    ).toThrow(UnauthorizedException);
  });

  it('rejects when the signature header is absent', () => {
    const body = Buffer.from(JSON.stringify({ InvoiceId: 'chk_1' }));
    const guard = makeGuard(SECRET);
    expect(() =>
      guard.canActivate(makeContext({ rawBody: body })),
    ).toThrow(UnauthorizedException);
  });

  it('rejects when the raw body was not captured', () => {
    const guard = makeGuard(SECRET);
    expect(() =>
      guard.canActivate(makeContext({ hmac: 'anything' })),
    ).toThrow(UnauthorizedException);
  });

  it('fails closed when the secret is not configured', () => {
    const body = Buffer.from(JSON.stringify({ InvoiceId: 'chk_1' }));
    const guard = makeGuard(undefined);
    expect(() =>
      guard.canActivate(makeContext({ rawBody: body, hmac: sign(body) })),
    ).toThrow(UnauthorizedException);
  });
});
