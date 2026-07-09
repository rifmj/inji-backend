import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HooksController } from './hooks.controller';
import { HooksService } from './hooks.service';
import { GeoService } from '../geo/geo.service';
import { PaymentHooksService } from './payment-hooks.service';
import { LoggerService } from '../../core/shared/logger.service';

describe('HooksController', () => {
  let controller: HooksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HooksController],
      providers: [
        { provide: HooksService, useValue: {} },
        { provide: GeoService, useValue: {} },
        { provide: PaymentHooksService, useValue: {} },
        // Deps of TipTopPaySignatureGuard, referenced via @UseGuards on the
        // payment routes.
        { provide: ConfigService, useValue: { get: () => undefined } },
        { provide: LoggerService, useValue: { error: jest.fn() } },
      ],
    }).compile();

    controller = module.get<HooksController>(HooksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
