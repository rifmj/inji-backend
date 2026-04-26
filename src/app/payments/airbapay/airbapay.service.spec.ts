import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { AirbapayService } from './airbapay.service';
import { PaymentService } from './payment.service';
import { SaleorSyncService } from '../../saleor/saleor-sync.service';
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

    service = module.get<AirbapayService>(AirbapayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
