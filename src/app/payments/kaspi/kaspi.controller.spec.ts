import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { KaspiController } from './kaspi.controller';
import { mockPrismaProvider } from '../../../test-utils/mock-providers';
import { AuthGuard } from '../../../core/auth/AuthGuard';

describe('KaspiController', () => {
  let controller: KaspiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KaspiController],
      providers: [mockPrismaProvider],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<KaspiController>(KaspiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

describe('KaspiController.createPaymentRequest', () => {
  const makeController = (prismaOver: Record<string, any> = {}) => {
    const prisma = {
      paymentWebhookEvent: {
        create: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({}),
      },
      kaspiPaymentRequest: {
        create: jest.fn().mockResolvedValue({ id: 'kpr_1' }),
      },
      ...prismaOver,
    };
    const controller = new KaspiController(prisma as any);
    return { controller, prisma };
  };

  const body = {
    phone: "+77001234567",
    amount: 2771,
    checkoutData: { id: "chk_1" },
  } as any;

  it('uses the authenticated userId, not the request body', async () => {
    const { controller, prisma } = makeController();
    await controller.createPaymentRequest('user-session', body);
    expect(prisma.kaspiPaymentRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user-session' }),
      }),
    );
  });

  it('rejects a missing phone', async () => {
    const { controller } = makeController();
    await expect(
      controller.createPaymentRequest('u1', { ...body, phone: '' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a non-positive amount', async () => {
    const { controller } = makeController();
    await expect(
      controller.createPaymentRequest('u1', { ...body, amount: 0 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('claims idempotency per checkout and creates the row', async () => {
    const { controller, prisma } = makeController();
    await controller.createPaymentRequest('u1', body);
    expect(prisma.paymentWebhookEvent.create).toHaveBeenCalledWith({
      data: { provider: 'kaspi', idempotencyKey: 'kaspi:chk_1' },
    });
    expect(prisma.kaspiPaymentRequest.create).toHaveBeenCalledTimes(1);
  });

  it('skips a duplicate checkout (unique-constraint) without creating a row', async () => {
    const { controller, prisma } = makeController({
      paymentWebhookEvent: {
        create: jest.fn().mockRejectedValue({ code: 'P2002' }),
        deleteMany: jest.fn(),
      },
    });
    const res = await controller.createPaymentRequest('u1', body);
    expect(res).toEqual({ ok: true, duplicate: true });
    expect(prisma.kaspiPaymentRequest.create).not.toHaveBeenCalled();
  });
});
