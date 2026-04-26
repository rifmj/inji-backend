jest.mock('firebase-admin', () => {
  const messaging = jest.fn(() => ({
    send: jest.fn().mockResolvedValue('ok'),
  }));
  const admin = {
    credential: { cert: jest.fn(() => ({})) },
    initializeApp: jest.fn(),
    messaging,
  };
  return { __esModule: true, default: admin };
});

import { Test, TestingModule } from '@nestjs/testing';
import { PushService } from './push.service';
import {
  mockLoggerProvider,
  mockPrismaProvider,
} from '../../../test-utils/mock-providers';

describe('PushService', () => {
  let service: PushService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PushService, mockLoggerProvider, mockPrismaProvider],
    }).compile();

    service = module.get<PushService>(PushService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
