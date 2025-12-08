import { Test, TestingModule } from '@nestjs/testing';
import { AirbapayController } from './airbapay.controller';

describe('AirbapayController', () => {
  let controller: AirbapayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AirbapayController],
    }).compile();

    controller = module.get<AirbapayController>(AirbapayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
