import { Test, TestingModule } from '@nestjs/testing';
import { KaspiService } from './kaspi.service';

describe('KaspiService', () => {
  let service: KaspiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KaspiService],
    }).compile();

    service = module.get<KaspiService>(KaspiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
