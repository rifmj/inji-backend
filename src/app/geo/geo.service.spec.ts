import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { GeoService } from './geo.service';
import { PrismaService } from '../../core/prisma/prisma.service';

const FROM = [51.24042771583543, 51.37659561165333];
const TO = [51.1, 51.2];
const PHONE = '77001234567';
const ESTIMATE_URL = 'https://business.taxi.yandex.ru/api/1.0/estimate';

describe('GeoService', () => {
  let service: GeoService;

  const deliveryEstimate = {
    findFirst: jest.fn(),
    create: jest.fn(),
  };
  const prismaServiceMock = { deliveryEstimate };

  const httpServiceMock = {
    post: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeoService,
        { provide: HttpService, useValue: httpServiceMock },
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile();

    service = module.get<GeoService>(GeoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('estimateDelivery', () => {
    it('looks up cache entries with a freshness lower bound ~15 min in the PAST', async () => {
      // A cache hit short-circuits before any HTTP call.
      deliveryEstimate.findFirst.mockResolvedValue({ id: 'cached' });

      const before = Date.now();
      await service.estimateDelivery(FROM, TO, PHONE);
      const after = Date.now();

      const where = deliveryEstimate.findFirst.mock.calls[0][0].where;
      expect(where.phone).toBe(PHONE);
      expect(where.route).toEqual({ equals: [FROM, TO] });

      // The regression guard: the filter must be a lower bound in the past
      // (createdAt >= now - 15min), never a future bound the row can't satisfy.
      const gte = (where.createdAt.gte as Date).getTime();
      expect(gte).toBeGreaterThanOrEqual(before - 15 * 60_000);
      expect(gte).toBeLessThanOrEqual(after - 15 * 60_000);
      expect(gte).toBeLessThan(before);
    });

    it('reuses a recent cached estimate without calling the Yandex API (cache hit)', async () => {
      const cached = { id: 'cached-offer', phone: PHONE };
      deliveryEstimate.findFirst.mockResolvedValue(cached);

      const result = await service.estimateDelivery(FROM, TO, PHONE);

      expect(result).toBe(cached);
      expect(httpServiceMock.post).not.toHaveBeenCalled();
      expect(deliveryEstimate.create).not.toHaveBeenCalled();
    });

    it('calls the Yandex API and persists the estimate on a cache miss', async () => {
      deliveryEstimate.findFirst.mockResolvedValue(null);
      const apiData = {
        offer: 'offer-123',
        service_levels: [{ class: 'express' }],
      };
      httpServiceMock.post.mockReturnValue({
        toPromise: () => Promise.resolve({ data: apiData }),
      });
      const created = { id: 'offer-123' };
      deliveryEstimate.create.mockResolvedValue(created);

      const result = await service.estimateDelivery(FROM, TO, PHONE);

      expect(httpServiceMock.post).toHaveBeenCalledTimes(1);
      const [url, body] = httpServiceMock.post.mock.calls[0];
      expect(url).toBe(ESTIMATE_URL);
      expect(body.route).toEqual([FROM, TO]);
      expect(body.phone).toBe(PHONE);

      expect(deliveryEstimate.create).toHaveBeenCalledWith({
        data: {
          id: 'offer-123',
          serviceLevels: apiData.service_levels,
          phone: PHONE,
          selectedClass: 'express',
          route: [FROM, TO],
          data: apiData,
        },
      });
      expect(result).toBe(created);
    });
  });
});
