import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { HooksService } from './hooks.service';
import { OrderHooksService } from './order-hooks.service';
import { TelegramService } from '../messaging/telegram/telegram.service';
import { PushService } from '../messaging/push/push.service';
import {
  mockLoggerProvider,
  mockPrismaProvider,
  mockSaleorProvider,
} from '../../test-utils/mock-providers';

describe('HooksService', () => {
  let service: HooksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        HooksService,
        OrderHooksService,
        mockLoggerProvider,
        mockPrismaProvider,
        mockSaleorProvider,
        {
          provide: TelegramService,
          useValue: { sendMessage: jest.fn() },
        },
        {
          provide: PushService,
          useValue: { sendToUser: jest.fn(), sendToDevice: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<HooksService>(HooksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
