import { Test, TestingModule } from '@nestjs/testing';
import { SaleorController } from './saleor.controller';

describe('SaleorController', () => {
  let controller: SaleorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SaleorController],
    }).compile();

    controller = module.get<SaleorController>(SaleorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
