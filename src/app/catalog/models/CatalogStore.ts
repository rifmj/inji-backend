import { CronJob } from 'cron';
import { GraphQLClient } from 'graphql-request';

import any from 'promise.any';
import { nodeCache } from '../../../core/utils/cache';

export class CatalogStore<
  T,
  Q extends {
    [name: string]: {
      totalCount: number;
      edges: { node: T }[];
    };
  },
> {
  private count: number;

  private _list: Array<T> = [];

  constructor(
    private props: {
      document?: string;
      documents?: string[];
      cacheKey: string;
      cronTime: string;
      client: GraphQLClient;
      onCronAdd(job: CronJob): void;
    },
  ) {}

  async init() {
    await any([this.refresh(), this.addCronJob()]);
  }

  async refresh() {
    const req = await this.props.client.request<Q>(this.props.document);
    const keys = Object.keys(req);
    const key = keys[0];
    if (req[key].totalCount > 0) {
      const { totalCount, edges } = req[key];
      this.count = totalCount;
      nodeCache.set(
        this.props.cacheKey,
        edges.map((v) => v.node),
      );
    }
  }

  get list() {
    return nodeCache.get(this.props.cacheKey);
  }

  private addCronJob() {
    const job = new CronJob(this.props.cronTime, () => {
      this.refresh();
    });
    job.start();
  }
}
