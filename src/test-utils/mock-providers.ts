import { Provider } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { LoggerService } from '../core/shared/logger.service';
import { SaleorService } from '../app/saleor/saleor.service';

/** Prisma-like proxy so any `prisma.foo.bar()` resolves to jest mocks. */
export function createMockPrisma(): Partial<PrismaService> {
  const model = () => ({
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  });
  return new Proxy(
    {
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
    } as Record<string, unknown>,
    {
      get(target, prop: string) {
        if (prop in target) return target[prop];
        return model();
      },
    },
  ) as unknown as Partial<PrismaService>;
}

export const mockPrismaProvider: Provider = {
  provide: PrismaService,
  useFactory: () => createMockPrisma() as PrismaService,
};

export const mockLoggerProvider: Provider = {
  provide: LoggerService,
  useValue: {
    info: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    d: jest.fn(),
  },
};

export const mockSaleorProvider: Provider = {
  provide: SaleorService,
  useValue: {
    client: { request: jest.fn() },
  },
};
