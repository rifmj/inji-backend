import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { GeoController } from './geo.controller';
import { GeoService } from './geo.service';
import { mockPrismaProvider } from '../../test-utils/mock-providers';

describe('GeoController', () => {
  let controller: GeoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      controllers: [GeoController],
      providers: [GeoService, mockPrismaProvider],
    }).compile();

    controller = module.get<GeoController>(GeoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
