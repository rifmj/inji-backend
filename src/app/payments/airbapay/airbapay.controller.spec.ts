import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { AirbapayController } from './airbapay.controller';
import { AirbapayService } from './airbapay.service';
import { PaymentService } from './payment.service';
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
      isOrderPaid: jest.fn().mockResolvedValue(false),
    };
    const prisma = {
      paymentWebhookEvent: {
        create: jest.fn().mockResolvedValue({}),
        // Only consulted after a P2002 claim clash; default to an
        // already-settled row so a duplicate callback simply skips.
        findUnique: jest
          .fn()
          .mockResolvedValue({ status: 'processed', orderId: 'ord_1' }),
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

  it('creates the order, persists its id, marks it paid, then settles', async () => {
    const { controller, saleor, prisma } = makeController();
    const res = await controller.paymentCallback({
      orderId: 'chk_1',
      state: 'confirmed',
    } as any);
    expect(prisma.paymentWebhookEvent.create).toHaveBeenCalledWith({
      data: { provider: 'airbapay', idempotencyKey: 'airbapay:chk_1' },
    });
    expect(saleor.createOrderFromCheckout).toHaveBeenCalledWith('chk_1');
    // order id is persisted before payment so a retry can resume
    expect(prisma.paymentWebhookEvent.update).toHaveBeenCalledWith({
      where: { idempotencyKey: 'airbapay:chk_1' },
      data: { orderId: 'ord_1' },
    });
    expect(saleor.markOrderAsPaid).toHaveBeenCalledWith('ord_1');
    expect(prisma.paymentWebhookEvent.update).toHaveBeenCalledWith({
      where: { idempotencyKey: 'airbapay:chk_1' },
      data: { status: 'processed' },
    });
    expect(res).toEqual({ status: 'success' });
  });

  it('skips a duplicate confirmed callback (already settled) without creating an order', async () => {
    const { controller, saleor } = makeController({
      create: jest.fn().mockRejectedValue({ code: 'P2002' }),
      findUnique: jest
        .fn()
        .mockResolvedValue({ status: 'processed', orderId: 'ord_1' }),
    });
    await controller.paymentCallback({
      orderId: 'chk_1',
      state: 'confirmed',
    } as any);
    expect(saleor.createOrderFromCheckout).not.toHaveBeenCalled();
    expect(saleor.markOrderAsPaid).not.toHaveBeenCalled();
  });

  it('resumes a prior attempt that created the order but had not paid it', async () => {
    const { controller, saleor, prisma } = makeController({
      create: jest.fn().mockRejectedValue({ code: 'P2002' }),
      findUnique: jest
        .fn()
        .mockResolvedValue({ status: 'processing', orderId: 'ord_resumed' }),
    });
    await controller.paymentCallback({
      orderId: 'chk_1',
      state: 'confirmed',
    } as any);
    // does not re-create the (already consumed) checkout...
    expect(saleor.createOrderFromCheckout).not.toHaveBeenCalled();
    // ...but pays the persisted order and settles it
    expect(saleor.markOrderAsPaid).toHaveBeenCalledWith('ord_resumed');
    expect(prisma.paymentWebhookEvent.update).toHaveBeenCalledWith({
      where: { idempotencyKey: 'airbapay:chk_1' },
      data: { status: 'processed' },
    });
  });

  it('settles without re-marking when a resumed order is already paid', async () => {
    const { controller, saleor, prisma } = makeController({
      create: jest.fn().mockRejectedValue({ code: 'P2002' }),
      findUnique: jest
        .fn()
        .mockResolvedValue({ status: 'processing', orderId: 'ord_paid' }),
    });
    saleor.isOrderPaid.mockResolvedValue(true);
    await controller.paymentCallback({
      orderId: 'chk_1',
      state: 'confirmed',
    } as any);
    // a prior attempt already paid it — re-marking would error and loop forever
    expect(saleor.createOrderFromCheckout).not.toHaveBeenCalled();
    expect(saleor.markOrderAsPaid).not.toHaveBeenCalled();
    expect(prisma.paymentWebhookEvent.update).toHaveBeenCalledWith({
      where: { idempotencyKey: 'airbapay:chk_1' },
      data: { status: 'processed' },
    });
  });

  it('asks for retry (does not double-create) when another attempt is in progress', async () => {
    const { controller, saleor } = makeController({
      create: jest.fn().mockRejectedValue({ code: 'P2002' }),
      findUnique: jest
        .fn()
        .mockResolvedValue({ status: 'processing', orderId: null }),
    });
    await expect(
      controller.paymentCallback({
        orderId: 'chk_1',
        state: 'confirmed',
      } as any),
    ).rejects.toThrow();
    expect(saleor.createOrderFromCheckout).not.toHaveBeenCalled();
    expect(saleor.markOrderAsPaid).not.toHaveBeenCalled();
  });

  it('does NOT settle when mark-as-paid fails, so a retry can re-run', async () => {
    const { controller, saleor, prisma } = makeController();
    saleor.markOrderAsPaid.mockResolvedValue({
      orderMarkAsPaid: { errors: [{ field: null, message: 'boom' }] },
    });
    await expect(
      controller.paymentCallback({
        orderId: 'chk_1',
        state: 'confirmed',
      } as any),
    ).rejects.toThrow();
    // the order id was persisted, but the row was never flipped to 'processed'
    expect(prisma.paymentWebhookEvent.update).not.toHaveBeenCalledWith({
      where: { idempotencyKey: 'airbapay:chk_1' },
      data: { status: 'processed' },
    });
  });

  it('releases the claim if order creation fails (order was not created)', async () => {
    const { controller, saleor, prisma } = makeController();
    saleor.createOrderFromCheckout.mockRejectedValue(new Error('saleor down'));
    await expect(
      controller.paymentCallback({
        orderId: 'chk_1',
        state: 'confirmed',
      } as any),
    ).rejects.toThrow();
    expect(prisma.paymentWebhookEvent.deleteMany).toHaveBeenCalledWith({
      where: { idempotencyKey: 'airbapay:chk_1' },
    });
    expect(saleor.markOrderAsPaid).not.toHaveBeenCalled();
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
