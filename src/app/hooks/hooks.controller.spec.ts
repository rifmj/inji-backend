import { Test, TestingModule } from '@nestjs/testing';
import { HooksController } from './hooks.controller';
import { HooksService } from './hooks.service';
import { GeoService } from '../geo/geo.service';
import { PaymentHooksService } from './payment-hooks.service';

describe('HooksController', () => {
  let controller: HooksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HooksController],
      providers: [
        { provide: HooksService, useValue: {} },
        { provide: GeoService, useValue: {} },
        { provide: PaymentHooksService, useValue: {} },
      ],
    }).compile();

    controller = module.get<HooksController>(HooksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
