import { Test, TestingModule } from '@nestjs/testing';
import { KaspiController } from './kaspi.controller';

describe('KaspiController', () => {
  let controller: KaspiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KaspiController],
    }).compile();

    controller = module.get<KaspiController>(KaspiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
