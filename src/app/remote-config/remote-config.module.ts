import { Module } from '@nestjs/common';
import { RemoteConfigController } from './remote-config.controller';
import { RemoteConfigService } from './remote-config.service';

@Module({
  controllers: [RemoteConfigController],
  providers: [RemoteConfigService],
})
export class RemoteConfigModule {}
