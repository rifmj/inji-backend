import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { DeliveryController } from './delivery.controller';
import { GeoService } from '../geo/geo.service';
import {
  mockPrismaProvider,
  mockSearchProvider,
} from '../../test-utils/mock-providers';

describe('DeliveryController', () => {
  let controller: DeliveryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      controllers: [DeliveryController],
      providers: [GeoService, mockSearchProvider, mockPrismaProvider],
    }).compile();

    controller = module.get<DeliveryController>(DeliveryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
