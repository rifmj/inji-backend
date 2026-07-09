import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { AirbapayController } from './airbapay.controller';
import { AirbapayService } from './airbapay.service';
import { PaymentService } from './payment.service';
import { SaleorSyncService } from '../../saleor/saleor-sync.service';
import { AuthGuard } from '../../../core/auth/AuthGuard';
import { AirbaPayCallbackGuard } from './guards/airbapay-callback.guard';
import {
  mockPrismaProvider,
  mockSaleorProvider,
} from '../../../test-utils/mock-providers';

describe('AirbapayController', () => {
  let controller: AirbapayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      controllers: [AirbapayController],
      providers: [
        AirbapayService,
        SaleorSyncService,
        mockPrismaProvider,
        mockSaleorProvider,
        { provide: ConfigService, useValue: { get: () => undefined } },
        {
          provide: PaymentService,
          useFactory: (prisma: PrismaService) => new PaymentService(prisma),
          inject: [PrismaService],
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AirbaPayCallbackGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AirbapayController>(AirbapayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

describe('AirbapayController.paymentCallback', () => {
  const makeController = (prismaOver: Record<string, unknown> = {}) => {
    const saleor = {
      createOrderFromCheckout: jest.fn().mockResolvedValue('ord_1'),
      markOrderAsPaid: jest
        .fn()
        .mockResolvedValue({ orderMarkAsPaid: { errors: [] } }),
    };
    const prisma = {
      paymentWebhookEvent: {
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({}),
        ...prismaOver,
      },
    };
    const controller = new AirbapayController(
      {} as any,
      {} as any,
      saleor as any,
      prisma as any,
    );
    return { controller, saleor, prisma };
  };

  it('creates the order and marks it paid on a confirmed callback', async () => {
    const { controller, saleor, prisma } = makeController();
    const res = await controller.paymentCallback({
      orderId: 'chk_1',
      state: 'confirmed',
    } as any);
    expect(prisma.paymentWebhookEvent.create).toHaveBeenCalledWith({
      data: { provider: 'airbapay', idempotencyKey: 'airbapay:chk_1' },
    });
    expect(saleor.createOrderFromCheckout).toHaveBeenCalledWith('chk_1');
    expect(saleor.markOrderAsPaid).toHaveBeenCalledWith('ord_1');
    expect(res).toEqual({ status: 'success' });
  });

  it('skips a duplicate confirmed callback (unique-constraint) without creating an order', async () => {
    const { controller, saleor } = makeController({
      create: jest.fn().mockRejectedValue({ code: 'P2002' }),
    });
    await controller.paymentCallback({
      orderId: 'chk_1',
      state: 'confirmed',
    } as any);
    expect(saleor.createOrderFromCheckout).not.toHaveBeenCalled();
  });

  it('does not create or pay an order on a rejected callback', async () => {
    const { controller, saleor } = makeController();
    await controller.paymentCallback({
      orderId: 'chk_1',
      state: 'rejected',
    } as any);
    expect(saleor.createOrderFromCheckout).not.toHaveBeenCalled();
    expect(saleor.markOrderAsPaid).not.toHaveBeenCalled();
  });
});
