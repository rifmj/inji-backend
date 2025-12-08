import { Test, TestingModule } from '@nestjs/testing';
import { AirbapayService } from './airbapay.service';

describe('AirbapayService', () => {
  let service: AirbapayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AirbapayService],
    }).compile();

    service = module.get<AirbapayService>(AirbapayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
