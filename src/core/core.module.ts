import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { SearchModule } from './search/search.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [AuthModule, CommonModule, SearchModule, RedisModule],
  exports: [AuthModule],
})
export class CoreModule {}
