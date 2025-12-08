import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType, RedisFunctions } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit {
  public client: RedisClientType<any, any, any>;

  constructor() {}

  async onModuleInit() {
    // const client = await createClient({
    //   url: `redis://63.250.60.124:6379`,
    //   password: 'AXd4qud3aqkl',
    // })
    //   .on('error', (err) => console.log('Redis Client Error', err))
    //   .connect();
    // this.client = client;
  }
}
