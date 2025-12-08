import { Test, TestingModule } from '@nestjs/testing';
import { RemoteConfigService } from './remote-config.service';

describe('RemoteConfigService', () => {
  let service: RemoteConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RemoteConfigService],
    }).compile();

    service = module.get<RemoteConfigService>(RemoteConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
