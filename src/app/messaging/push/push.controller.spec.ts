import { Test, TestingModule } from '@nestjs/testing';
import { PushController } from './push.controller';
import { PushService } from './push.service';
import { mockSaleorProvider } from '../../../test-utils/mock-providers';

describe('PushController', () => {
  let controller: PushController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PushController],
      providers: [
        mockSaleorProvider,
        {
          provide: PushService,
          useValue: {
            sendToUser: jest.fn(),
            sendToDevice: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PushController>(PushController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
