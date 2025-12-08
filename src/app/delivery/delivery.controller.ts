import { Body, Controller, Get, Post } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../core/prisma/prisma.service';
import { GeoService } from '../geo/geo.service';

@Controller('delivery')
export class DeliveryController {
  constructor(
    private httpService: HttpService,
    private prismaService: PrismaService,
    private geoService: GeoService,
  ) {}

  @Get('requirements')
  async requirements() {
    const res = await this.httpService
      .get('https://business.taxi.yandex.ru/client-api/3.0/cities', {
        headers: {
          Authorization: process.env.YANDEX_TAXI_TOKEN,
        },
      })
      .toPromise();
    return res.data;
  }

  @Post('estimate-by-address')
  async estimateDeilveryByAddress(
    @Body('to') addressQuery: string,
    @Body('phone') phone: string,
  ) {
    return this.geoService.estimateDeliveryByAddressQuery(addressQuery, phone);
  }

  @Post('estimate')
  async estimateDelivery(
    @Body()
    {
      from = [51.24042771583543, 51.37659561165333],
      to = [51.208054, 51.363045],
      phone = '+71234567890',
    },
  ) {
    return this.geoService.estimateDelivery(from, to, phone);
  }

  @Post('order')
  async createOrder(
    @Body()
    props: {
      comment: string;
      fullname: string;
      phone: string;
      source: YaPlace & YaPlaceExtraData;
      interim_destinations: YaPlace[];
      destination: YaPlace[];
      class: 'econom' | 'express';
    },
  ) {
    const res = await this.httpService
      .post(
        `https://business.taxi.yandex.ru/api/1.0/client/{идентификатор клиента}/order/`,
        {
          comment: props.comment,
        },
        {
          headers: {
            Authorization: process.env.YANDEX_TAXI_TOKEN,
          },
        },
      )
      .toPromise();
    return res.data;
  }
}

interface YaPlace {
  // Страна.
  country: string;
  // Полный адрес.
  fullname: string;
  // Координаты точки назначения. Формат параметра:[долгота,широта]
  geopoint: string;
  // Населенный пункт.
  locality: string;
  // Номер подъезда.
  porchnumber: string;
  // Номер дома и корпуса.
  premisenumber: string;
  // Название улицы или микрорайона (для адресов с нумерацией по микрорайону).
  thoroughfare: string;
}

interface YaPlaceExtraData {
  // — телефон получателя/отправителя. Формат: строка.
  contact_phone: string;
  // — этаж отправителя/получателя. Формат: строка.
  floor: string;
  // — квартира отправителя/получателя. Формат: строка.
  apartment: string;
  // — комментарий к доставке. Формат: строка.
  comment: string;
}
