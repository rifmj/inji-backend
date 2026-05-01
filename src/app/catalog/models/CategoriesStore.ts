import { CronJob } from 'cron';
import { GraphQLClient } from 'graphql-request';

import { FlatCategoriesQuery } from '../catalog.graphql';
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
  constructor(
    private props: {
      cacheKey: string;
      cronTime: string;
      client: GraphQLClient;
      onCronAdd(job: CronJob): void;
    },
  ) {}

  async init() {}

  async fetchAll() {
    const first = 100;
    console.info('Fetching categories');
    try {
      const res = await this.props.client.request(FlatCategoriesQuery, {
        first,
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

  get list() {
    return nodeCache.get(this.props.cacheKey);
  }
}
