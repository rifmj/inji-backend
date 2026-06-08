import { Test, TestingModule } from '@nestjs/testing';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';

describe('TelegramController', () => {
  let controller: TelegramController;

  const telegramServiceMock = {
    isValidWebhookSecret: jest.fn(() => true),
    handleAuthUpdate: jest.fn(async () => undefined),
  };

  const resMock = () => {
    const res: any = {};
    res.status = jest.fn(() => res);
    res.send = jest.fn(() => res);
    return res;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TelegramController],
      providers: [{ provide: TelegramService, useValue: telegramServiceMock }],
    }).compile();

    controller = module.get<TelegramController>(TelegramController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('rejects updates with an invalid secret', async () => {
    telegramServiceMock.isValidWebhookSecret.mockReturnValueOnce(false);
    const res = resMock();

    await controller.webhook({ update_id: 1 }, 'wrong-secret', res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(telegramServiceMock.handleAuthUpdate).not.toHaveBeenCalled();
  });

  it('forwards valid updates to the service and acks with 200', async () => {
    const res = resMock();
    const update = { update_id: 2 };

    await controller.webhook(update, 'right-secret', res);

    expect(telegramServiceMock.handleAuthUpdate).toHaveBeenCalledWith(update);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
