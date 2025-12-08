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
