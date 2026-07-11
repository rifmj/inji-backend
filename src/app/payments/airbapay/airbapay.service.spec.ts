import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { AirbapayService } from './airbapay.service';
import { PaymentService } from './payment.service';
import {
  mockPrismaProvider,
  mockSaleorProvider,
} from '../../../test-utils/mock-providers';

describe('AirbapayService', () => {
  let service: AirbapayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        AirbapayService,
        mockPrismaProvider,
        mockSaleorProvider,
        { provide: ConfigService, useValue: { get: () => undefined } },
        {
          provide: PaymentService,
          useFactory: (prisma: PrismaService) => new PaymentService(prisma),
          inject: [PrismaService],
        },
      ],
    }).compile();

    service = module.get<AirbapayService>(AirbapayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

describe('AirbapayService.preCreateOrder (server-authoritative amount)', () => {
  const makeService = (
    over: { checkoutTotal?: number | null; salesCode?: string } = {},
  ) => {
    const posts: { url: string; body: any }[] = [];
    const http = {
      post: jest.fn((url: string, body: any) => {
        posts.push({ url, body });
        return {
          toPromise: () =>
            Promise.resolve(
              url.includes('/authenticate')
                ? { data: { accessToken: 'tok', expiresIn: 3600 } }
                : {
                    data: { orderId: 'ao_1', redirectUrl: 'https://pay/redirect' },
                  },
            ),
        };
      }),
      get: jest.fn(() => ({
        toPromise: () =>
          Promise.resolve({ data: [{ code: 'airba', name: 'Airba' }] }),
      })),
    };
    const config = {
      get: (key: string) => {
        switch (key) {
          case 'payments.airbapay':
            return { userId: 'u', userSecret: 's' };
          case 'payments.airbapay.salesCode':
            return over.salesCode ?? 'SRV1';
          case 'payments.airbapay.callbackSecret':
            return 'cbsecret';
          case 'common':
            return { originHost: 'https://api.example' };
          default:
            return undefined;
        }
      },
    };
    const saleor = {
      getCheckoutTotal: jest
        .fn()
        .mockResolvedValue(
          over.checkoutTotal === undefined ? 1000 : over.checkoutTotal,
        ),
    };
    const service = new AirbapayService(
      http as any,
      config as any,
      saleor as any,
    );
    return { service, http, saleor, posts };
  };

  const clientBody = () => ({
    orderId: 'chk_1', // Saleor checkout id
    totalCost: 5, // attacker-lowered amount
    salesCode: 'ABC1', // client-supplied merchant code
    mobile: '7001234567',
    goods: [],
  });

  it('overrides client totalCost and salesCode with server-side values', async () => {
    const { service, saleor, posts } = makeService();
    const res = await service.preCreateOrder(clientBody() as any);

    expect(saleor.getCheckoutTotal).toHaveBeenCalledWith('chk_1');
    expect(res).toEqual({
      orderId: 'ao_1',
      redirectUrl: 'https://pay/redirect',
    });
    const preCreate = posts.find((p) => p.url.includes('/order/pre-create'));
    expect(preCreate.body.totalCost).toBe(1000); // not the client's 5
    expect(preCreate.body.salesCode).toBe('SRV1'); // not the client's ABC1
  });

  it('rejects (returns null) and sends nothing when the checkout is missing', async () => {
    const { service, posts } = makeService({ checkoutTotal: null });
    const res = await service.preCreateOrder(clientBody() as any);

    expect(res).toBeNull();
    expect(
      posts.find((p) => p.url.includes('/order/pre-create')),
    ).toBeUndefined();
  });
});
