import { CronJob } from 'cron';
import { GraphQLClient } from 'graphql-request';
import { FlatProductsQuery } from '../catalog.graphql';
import { RedisService } from '../../../core/redis/redis.service';

export type ProductErpData = {
  item_name: string;
  saleor_identifier: string;
  kind: string;
};

export class ProductsStore<
  T,
  Q extends {
    [name: string]: {
      totalCount: number;
      edges: { node: T }[];
    };
  },
> {
  private count: number;

  private erpData: ProductErpData[] = [];

  list: any[] = [];

  constructor(
    private props: {
      cacheKey: string;
      cronTime: string;
      redis: RedisService;
      client: GraphQLClient;
      onCronAdd(job: CronJob): void;
    },
  ) {}

  get stocks() {
    const stocks = {};
    for (const item of this.list) {
      stocks[item.id] = 100;
    }
    return stocks;
  }

  async init() {
    // this.props.redis.client.get(this.props.cacheKey).then((res) => {
    //   console.info('redis result', res.length);
    //   try {
    //     const data = JSON.parse(res);
    //     this.list = data;
    //   } catch (e) {}
    // });
    // await Promise.all([this.refresh(), this.addCronJob()]);
  }

  async fetchAll() {
    const first = 100;
    console.info('Trying to fetch products');
    const res = await this.props.client.request(FlatProductsQuery, {
      first,
      locale: 'RU',
    });
    console.info('result', res);
    let endCursor = res.products.pageInfo.endCursor;
    console.info('ressss', res.products.pageInfo);
    if (res.products.edges.length < first) {
      endCursor = null;
    }
    console.info('RefreshProducts:EndCursor', endCursor);
    if (!endCursor) {
      return res.products.edges.map((v) => v.node);
    } else {
      const result = [res];
      const limit = 500;
      let currentCount = 0;
      while (endCursor !== null && currentCount <= limit) {
        const data = await this.props.client.request(FlatProductsQuery, {
          first,
          locale: 'RU',
          after: endCursor,
        });
        result.push(data);
        currentCount += data.products.edges.length;
        console.info(
          'RefreshProducts:Results',
          data.products.edges.length,
          data.products.pageInfo,
        );
        if (data.products.edges.length < first) {
          endCursor = null;
        } else {
          endCursor = data.products.pageInfo.endCursor;
        }
      }
      const products = result
        .map((d) => d.products.edges.map((v) => v.node))
        .flat();
      console.info('RefreshProducts', products.length);
      return products.map((product) => {
        return product;
      });
    }
  }

  async refresh() {
    const products = await this.fetchAll();
    this.count = products.length;
    await this.props.redis.client.set(
      this.props.cacheKey,
      JSON.stringify(products),
    );
    return products;
  }

  private async addCronJob() {
    const job = new CronJob(this.props.cronTime, () => {
      this.refresh();
    });
    job.start();
    return null;
  }
}
