import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { mockPrismaProvider } from '../../test-utils/mock-providers';

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentsService, mockPrismaProvider],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
