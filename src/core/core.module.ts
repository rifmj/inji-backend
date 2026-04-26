import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [AuthModule, CommonModule, RedisModule],
  exports: [AuthModule],
})
export class CoreModule {}
