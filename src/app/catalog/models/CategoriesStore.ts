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

  async init() {
    // Schedule the periodic refresh, then kick off an initial population.
    // refresh() is intentionally not awaited so a slow or unreachable Saleor
    // never blocks application bootstrap.
    this.addCronJob();
    // Detached on purpose; swallow rejections so a Saleor failure can't bubble
    // up as an unhandled rejection (there is no global unhandledRejection
    // handler, so that would otherwise crash the process).
    this.refresh().catch((e) =>
      console.error('CategoriesStore initial refresh failed', e),
    );
  }

  async refresh() {
    const categories = await this.fetchAll();
    // fetchAll() returns [] when it swallows a transient error — don't clobber
    // a previously-good cache with an empty list in that case.
    if (categories.length) {
      nodeCache.set(this.props.cacheKey, categories);
    }
  }

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
    return nodeCache.get(this.props.cacheKey) ?? [];
  }

  private addCronJob() {
    const job = new CronJob(this.props.cronTime, () => {
      this.refresh().catch((e) =>
        console.error('CategoriesStore cron refresh failed', e),
      );
    });
    this.props.onCronAdd(job);
    job.start();
  }
}
