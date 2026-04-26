import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from './telegram.service';
import { mockPrismaProvider } from '../../../test-utils/mock-providers';

describe('TelegramService', () => {
  let service: TelegramService;
  const prevEnv = process.env.ENV;

  beforeAll(() => {
    process.env.ENV = 'dev';
  });

  afterAll(() => {
    process.env.ENV = prevEnv;
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramService,
        mockPrismaProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => 'test-token'),
          },
        },
      ],
    }).compile();

    service = module.get<TelegramService>(TelegramService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
