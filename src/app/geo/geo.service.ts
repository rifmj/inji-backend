import { Injectable, NotFoundException } from '@nestjs/common';
import { SearchService } from '../../core/search/search.service';
import { HttpService } from '@nestjs/axios';
import { XMLParser } from 'fast-xml-parser';
import { PrismaService } from '../../core/prisma/prisma.service';
import { getNowUtcDate } from '../../core/utils/date';
import { nodeCache } from 'src/core/utils/cache';

@Injectable()
export class GeoService {
  constructor(
    private searchService: SearchService,
    private httpService: HttpService,
    private prismaService: PrismaService,
  ) {}

  API_KEY = 'b7e95367-77aa-4c39-9b23-33173ab73050';

  async getWeather() {
    /**
     * https://rapidapi.com/foreca-ltd-foreca-ltd-default/api/foreca-weather
     * {
     *   "current": {
     *     "time": "2021-09-24T10:42+01:00",
     *     "symbol": "d000",
     *     "symbolPhrase": "clear",
     *     "temperature": 16,
     *     "feelsLikeTemp": 16,
     *     "relHumidity": 75,
     *     "dewPoint": 12,
     *     "windSpeed": 5,
     *     "windDirString": "W",
     *     "windGust": 9,
     *     "precipProb": 2,
     *     "precipRate": 0,
     *     "cloudiness": 15,
     *     "thunderProb": 0,
     *     "uvIndex": 2,
     *     "pressure": 1016.51,
     *     "visibility": 36143
     *   }
     * }
     */
    const cached = nodeCache.get('geo-weather');
    if (cached) {
      return cached;
    }
    const options = {
      method: 'GET',
      url: 'https://foreca-weather.p.rapidapi.com/current/102643743',
      params: {
        alt: '0',
        tempunit: 'C',
        windunit: 'MS',
        tz: 'Europe/London',
        lang: 'ru',
      },
      headers: {
        'X-RapidAPI-Key': 'd1cb4e3b94msh558e1daa22938dfp181e97jsnde07cdfeaf3e',
        'X-RapidAPI-Host': 'foreca-weather.p.rapidapi.com',
      },
    };
    const data = (await this.httpService.request(options).toPromise()).data;
    nodeCache.set('geo-weather', data, 60 * 60 * 2);
    const temp = data?.current?.temperature;
    const feelsLikeTemp = data?.current?.feelsLikeTemp;
    const phrase = data?.current?.symbolPhrase;
    const symbol = data?.current?.symbol;
    return { temp, feelsLikeTemp, phrase, symbol };
  }

  async getCurrencyRates() {
    const rates = await this.httpService
      .get('https://nationalbank.kz/rss/rates_all.xml')
      .toPromise();
    const parser = new XMLParser();
    const json = parser.parse(rates.data);
    const arr = json?.rss?.channel?.item || [];
    const rub = arr.find((v) => v.title === 'RUB');
    const pubDate = rub.pubDate;
    const todayRates = arr.filter((v) => v.pubDate === pubDate);
    const rubRate = todayRates.find((v) => v.title === 'RUB');
    const usdRate = todayRates.find((v) => v.title === 'USD');
    const eurRate = todayRates.find((v) => v.title === 'EUR');
    const cnyRate = todayRates.find((v) => v.title === 'CNY');
    const data = [rubRate, usdRate, eurRate, cnyRate].map((v) => ({
      title: v.title,
      rate: v.description,
      change: v.change,
      quantity: v.quant,
    }));
    return data;
  }

  async getFromQuery(query: string): Promise<{
    response: {
      GeoObjectCollection: {
        featureMember: {
          GeoObject: { Point: { pos: string } };
        }[];
      };
    };
  } | null> {
    const q = 'казахстан, уральск, ' + query?.toLowerCase()?.trim();

    // try {
    //   const data = await this.searchService.client.search({
    //     index: 'inji-ya-geocoding',
    //     body: { query: { ids: { values: [q] } } },
    //   });
    //
    //   if (data?.body?.hits?.hits?.length) {
    //     return data?.body?.hits?.hits?.[0]?._source;
    //   }
    // } catch (e) {
    //   console.info('Cannot search geocode');
    // }

    try {
      const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${
        this.API_KEY
      }&format=json&geocode=${encodeURIComponent(
        query,
      )}&ll=51.23,51.40&results=100&spn=2.0,2.0&lang=ru_RU`;
      const r = await this.httpService.get(url).toPromise();
      if (r.status === 200) {
        // try {
        //   await this.searchService.writeYaGeoCode(q, r.data);
        // } catch (e) {
        //   console.info('Cannot write geocode');
        // }
        return r.data;
      }
      return null;
    } catch (e) {
      console.info('Cannot query yamaps geocode', query);
      return null;
    }
  }

  async estimateDelivery(from: any[], to: any[], phone: string) {
    const route = [from, to];
    const selectedClass = 'express';

    const expiresAt = getNowUtcDate();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const estimated = await this.prismaService.deliveryEstimate.findFirst({
      where: {
        route: {
          equals: route,
        },
        createdAt: {
          gte: expiresAt,
        },
        phone,
      },
    });

    if (estimated) {
      return estimated;
    }

    try {
      const res = await this.httpService
        .post(
          'https://business.taxi.yandex.ru/api/1.0/estimate',
          {
            route,
            requirements: {
              door_to_door: true,
            },
            phone,
            selected_class: selectedClass,
          },
          {
            headers: {
              Authorization: process.env.YANDEX_TAXI_TOKEN,
            },
          },
        )
        .toPromise();

      if (res?.data?.offer) {
        const data = res.data;
        const tx = await this.prismaService.deliveryEstimate.create({
          data: {
            id: data.offer,
            serviceLevels: data.service_levels,
            phone,
            selectedClass,
            route,
            data,
          },
        });
        return tx;
      }

      return null;
    } catch (e) {
      console.info('Cannot estimate delivery', from, to, phone);
      return null;
    }
  }

  async estimateDeliveryByAddressQuery(
    addressQuery: string,
    phone: string,
  ): Promise<any> {
    if (!addressQuery || !phone) {
      throw new NotFoundException();
    }

    const key = `geo-ya-taxi-est:${addressQuery}:${phone}`;
    const cached = nodeCache.get(key);

    console.info('estimateDeliveryByAddressQuery', key, cached);

    if (cached) {
      return cached;
    }

    const address = await this.getFromQuery(addressQuery);

    if (!address) {
      return null;
    }

    const position =
      address.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject
        ?.Point?.pos;

    if (position) {
      const toCoordinates = position
        .split(' ')
        .reverse()
        .map((v) => parseFloat(v));
      console.info('estimateDeliveryByAddressQuery1', key);
      const estimated = await this.estimateDelivery(
        [51.24042771583543, 51.37659561165333],
        toCoordinates,
        phone,
      );
      console.info('estimateDeliveryByAddressQuery1', key, estimated);
      if (estimated) {
        nodeCache.set(key, estimated, 60 * 15);
        return estimated;
      }
      return null;
    }

    return null;
  }
}
