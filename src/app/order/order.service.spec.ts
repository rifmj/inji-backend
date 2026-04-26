import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OrderService } from './order.service';
import { AirbaService } from '../payments/airbapay/airba.service';
import { mockSaleorProvider } from '../../test-utils/mock-providers';

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: AirbaService,
          useValue: {
            getAuthToken: jest.fn(),
            createPreOrder: jest.fn(),
          },
        },
        mockSaleorProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
