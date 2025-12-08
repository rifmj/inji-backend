import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { GraphQLClient } from 'graphql-request';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

import { CronJob } from 'cron';
import {
  Category,
  Product,
  QueryCategoriesResponse,
  QueryProductsResponse,
} from './catalog.types';
import { CategoriesStore } from './models/CategoriesStore';
import { ProductsStore } from './models/ProductsStore';
import { RedisService } from '../../core/redis/redis.service';

const any = require('promise.any');

const client = new GraphQLClient(process.env.GRAPHQL_CLIENT_URL, {
  headers: {
    authorization: `JWT ${process.env.SALEOR_BACKEND_TOKEN}`,
  },
});

@Injectable()
export class CatalogService implements OnModuleInit {
  private readonly logger = new Logger(CatalogService.name);

  private categoriesStore?: CategoriesStore<Category, QueryCategoriesResponse>;
  private productsStore?: ProductsStore<Product, QueryProductsResponse>;

  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  async onModuleInit() {
    // TODO FIX
    // return;
    try {
      this.categoriesStore = new CategoriesStore({
        client,
        cacheKey: 'categories',
        cronTime: this.categoryRefreshCron,
        onCronAdd: (job: CronJob) => {
          this.schedulerRegistry.addCronJob('categoryRefresh', job);
        },
      });
      this.productsStore = new ProductsStore({
        client,
        redis: this.redisService,
        cacheKey: 'products',
        cronTime: this.productRefreshCron,
        onCronAdd: (job: CronJob) => {
          this.schedulerRegistry.addCronJob('productRefresh', job);
        },
      });
      await Promise.all([
        this.categoriesStore.init(),
        this.productsStore.init(),
      ]);
    } catch (e) {
      console.info('Cannot refresh', e);
      this.logger.error('Cannot refresh', e);
    }
  }

  get categories() {
    return this.categoriesStore.list;
  }

  get products() {
    return this.productsStore.list;
  }

  get stocks() {
    return this.productsStore.stocks;
  }

  get categoryRefreshCron() {
    return this.configService.get('app.catalog.categoryRefreshCron');
  }

  get productRefreshCron() {
    return this.configService.get('app.catalog.productRefreshCron');
  }

  public async refreshCategories() {
    return this.categoriesStore.refresh();
  }

  public async refreshProducts() {
    return this.productsStore.refresh();
  }
}
