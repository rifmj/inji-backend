import { Test, TestingModule } from '@nestjs/testing';
import { KaspiController } from './kaspi.controller';
import { mockPrismaProvider } from '../../../test-utils/mock-providers';

describe('KaspiController', () => {
  let controller: KaspiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KaspiController],
      providers: [mockPrismaProvider],
    }).compile();

    controller = module.get<KaspiController>(KaspiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
