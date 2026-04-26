import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
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
