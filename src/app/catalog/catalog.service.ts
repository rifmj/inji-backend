import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { GraphQLClient } from 'graphql-request';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

import { CronJob } from 'cron';
import { Category, QueryCategoriesResponse } from './catalog.types';
import { CategoriesStore } from './models/CategoriesStore';

const client = new GraphQLClient(process.env.GRAPHQL_CLIENT_URL, {
  headers: {
    authorization: `JWT ${process.env.SALEOR_BACKEND_TOKEN}`,
  },
});

@Injectable()
export class CatalogService implements OnModuleInit {
  private readonly logger = new Logger(CatalogService.name);

  private categoriesStore?: CategoriesStore<Category, QueryCategoriesResponse>;

  constructor(
    private configService: ConfigService,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  async onModuleInit() {
    try {
      this.categoriesStore = new CategoriesStore({
        client,
        cacheKey: 'categories',
        cronTime: this.categoryRefreshCron,
        onCronAdd: (job: CronJob) => {
          this.schedulerRegistry.addCronJob('categoryRefresh', job);
        },
      });
      await this.categoriesStore.init();
    } catch (e) {
      console.info('Cannot init catalog', e);
      this.logger.error('Cannot init catalog', e);
    }
  }

  get categories() {
    return this.categoriesStore.list;
  }

  get stocks() {
    return {};
  }

  get categoryRefreshCron() {
    return this.configService.get('app.catalog.categoryRefreshCron');
  }
}
