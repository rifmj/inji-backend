import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { AirbapayController } from './airbapay.controller';
import { AirbapayService } from './airbapay.service';
import { PaymentService } from './payment.service';
import { SaleorSyncService } from '../../saleor/saleor-sync.service';
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
    }).compile();

    controller = module.get<AirbapayController>(AirbapayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

describe('AirbapayController.paymentCallback', () => {
  const makeController = () => {
    const saleor = {
      createOrderFromCheckout: jest.fn().mockResolvedValue('ord_1'),
      markOrderAsPaid: jest
        .fn()
        .mockResolvedValue({ orderMarkAsPaid: { errors: [] } }),
    };
    const controller = new AirbapayController(
      {} as any,
      {} as any,
      saleor as any,
    );
    return { controller, saleor };
  };

  it('creates the order and marks it paid on a confirmed callback', async () => {
    const { controller, saleor } = makeController();
    const res = await controller.paymentCallback({
      orderId: 'chk_1',
      state: 'confirmed',
    } as any);
    expect(saleor.createOrderFromCheckout).toHaveBeenCalledWith('chk_1');
    expect(saleor.markOrderAsPaid).toHaveBeenCalledWith('ord_1');
    expect(res).toEqual({ status: 'success' });
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
