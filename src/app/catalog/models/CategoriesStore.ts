import { CronJob } from 'cron';
import { gql, GraphQLClient } from 'graphql-request';

import * as any from 'promise.any';
import {
  FlatCategoriesQuery,
  FlatProductsQuery,
  QueryProductsDocument,
} from '../catalog.graphql';
import { nodeCache } from '../../../core/utils/cache';

export class CategoriesStore<
  T,
  Q extends {
    [name: string]: {
      totalCount: number;
      edges: { node: T }[];
    };
  },
> {
  private count: number;

  constructor(
    private props: {
      cacheKey: string;
      cronTime: string;
      client: GraphQLClient;
      onCronAdd(job: CronJob): void;
    },
  ) {}

  async init() {
    // console.info('Refresh categories');
    // await any([this.refresh(), this.addCronJob()]);
  }

  async fetchAll() {
    const first = 100;
    console.info('Fetching categories');
    try {
      const res = await this.props.client.request(FlatCategoriesQuery, {
        first,
        locale: 'RU',
      });
      console.info('Res, res', res);
      let endCursor = res.categories.pageInfo.endCursor;
      if (res.categories.edges.length < first) {
        endCursor = null;
      }
      if (!endCursor) {
        return res.categories.edges.map((v) => v.node);
      } else {
        const result = [res];
        while (endCursor !== null) {
          const data = await this.props.client.request(FlatCategoriesQuery, {
            first,
            after: endCursor,
            locale: 'RU',
          });
          result.push(data);
          if (data.categories.edges.length < first) {
            endCursor = null;
          } else {
            endCursor = data.categories.pageInfo.endCursor;
          }
        }
        return result.map((d) => d.categories.edges.map((v) => v.node)).flat();
      }
    } catch (e) {
      console.info('err', e);
      return [];
    }
  }

  async refresh() {
    // const categories = await this.fetchAll();
    // this.count = categories.length;
    // nodeCache.set(this.props.cacheKey, categories);
    return;
  }

  get list() {
    return nodeCache.get(this.props.cacheKey);
  }

  private async addCronJob() {
    // const job = new CronJob(this.props.cronTime, () => {
    //   this.refresh();
    // });
    // job.start();
    return null;
  }
}
