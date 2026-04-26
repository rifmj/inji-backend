import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { GeoService } from './geo.service';
import {
  mockPrismaProvider,
  mockSearchProvider,
} from '../../test-utils/mock-providers';

describe('GeoService', () => {
  let service: GeoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [GeoService, mockSearchProvider, mockPrismaProvider],
    }).compile();

    service = module.get<GeoService>(GeoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
