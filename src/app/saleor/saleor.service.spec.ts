import { Test, TestingModule } from '@nestjs/testing';
import { SaleorService } from './saleor.service';

describe('SaleorService', () => {
  let service: SaleorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SaleorService],
    }).compile();

    service = module.get<SaleorService>(SaleorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

describe('SaleorService.getCheckoutTotal', () => {
  const makeService = () => {
    const service = new SaleorService();
    const request = jest.fn();
    (service as any).client = { request };
    return { service, request };
  };

  it('derives the token from the checkout GID and returns the gross total', async () => {
    const gid = Buffer.from(
      'Checkout:11111111-1111-1111-1111-111111111111',
    ).toString('base64');
    const { service, request } = makeService();
    request.mockResolvedValue({
      checkout: { totalPrice: { gross: { amount: 1234 } } },
    });

    const total = await service.getCheckoutTotal(gid);

    expect(total).toBe(1234);
    // queried by token (this Saleor's `checkout` query takes token, not id)
    expect(request.mock.calls[0][1]).toEqual({
      token: '11111111-1111-1111-1111-111111111111',
    });
  });

  it('accepts a raw token as-is', async () => {
    const { service, request } = makeService();
    request.mockResolvedValue({
      checkout: { totalPrice: { gross: { amount: 5 } } },
    });
    await service.getCheckoutTotal('22222222-2222-2222-2222-222222222222');
    expect(request.mock.calls[0][1]).toEqual({
      token: '22222222-2222-2222-2222-222222222222',
    });
  });

  it('returns null for an unparseable id without querying Saleor', async () => {
    const { service, request } = makeService();
    const total = await service.getCheckoutTotal('not-a-gid');
    expect(total).toBeNull();
    expect(request).not.toHaveBeenCalled();
  });

  it('returns null when the checkout does not exist', async () => {
    const gid = Buffer.from(
      'Checkout:33333333-3333-3333-3333-333333333333',
    ).toString('base64');
    const { service, request } = makeService();
    request.mockResolvedValue({ checkout: null });
    expect(await service.getCheckoutTotal(gid)).toBeNull();
  });
});
