import { PaymentHooksService } from './payment-hooks.service';

const PAY_BODY = {
  InvoiceId: 'chk_1',
  PaymentAmount: '1000',
  TransactionId: 'tx_123',
  AccountId: 'user@saleor.local',
  Token: 'card-token',
  CardLastFour: '4242',
};

function makeService() {
  const request = jest.fn();
  const prisma = {
    paymentWebhookEvent: {
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({}),
    },
    user: { findUnique: jest.fn().mockResolvedValue({ id: 'u1' }) },
    savedCard: { create: jest.fn().mockResolvedValue({}) },
    invoice: { updateMany: jest.fn().mockResolvedValue({}) },
  };
  const logger = { info: jest.fn(), error: jest.fn() };
  const saleor = { client: { request } };
  const service = new PaymentHooksService(
    logger as any,
    prisma as any,
    saleor as any,
  );
  return { service, prisma, request };
}

describe('PaymentHooksService.payPayment idempotency', () => {
  it('processes a new payment: order first, then card, marks processed', async () => {
    const { service, prisma, request } = makeService();
    request.mockResolvedValue({
      orderCreateFromCheckout: { order: { id: 'ord_1' } },
    });

    const ok = await service.payPayment(PAY_BODY);

    expect(ok).toBe(true);
    expect(prisma.paymentWebhookEvent.create).toHaveBeenCalledWith({
      data: { provider: 'tiptoppay', idempotencyKey: 'tx_123' },
    });
    // order create + Saleor payment transaction create
    expect(request).toHaveBeenCalledTimes(2);
    expect(prisma.savedCard.create).toHaveBeenCalledTimes(1);
    expect(prisma.paymentWebhookEvent.update).toHaveBeenCalledWith({
      where: { idempotencyKey: 'tx_123' },
      data: { status: 'processed' },
    });
  });

  it('logs a mismatch when the charged amount != the order total', async () => {
    const { service, request } = makeService();
    const logger = (service as any).loggerService;
    request.mockResolvedValue({
      orderCreateFromCheckout: {
        order: { id: 'ord_1', total: { gross: { amount: 5000, currency: 'KZT' } } },
      },
    });

    await service.payPayment(PAY_BODY); // PaymentAmount '1000' != 5000

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'amountMismatch' }),
      expect.any(String),
    );
  });

  it('skips a duplicate callback without creating an order', async () => {
    const { service, prisma, request } = makeService();
    prisma.paymentWebhookEvent.create.mockRejectedValueOnce({ code: 'P2002' });

    const ok = await service.payPayment(PAY_BODY);

    expect(ok).toBe(true);
    expect(request).not.toHaveBeenCalled();
    expect(prisma.savedCard.create).not.toHaveBeenCalled();
  });

  it('releases the claim when order creation fails, so a retry can re-run', async () => {
    const { service, prisma, request } = makeService();
    request.mockRejectedValue(new Error('checkout gone'));

    const ok = await service.payPayment(PAY_BODY);

    expect(ok).toBe(false);
    expect(prisma.savedCard.create).not.toHaveBeenCalled();
    expect(prisma.paymentWebhookEvent.deleteMany).toHaveBeenCalledWith({
      where: { idempotencyKey: 'tx_123' },
    });
  });
});
