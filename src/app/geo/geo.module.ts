import { Module } from '@nestjs/common';
import { GeoService } from './geo.service';
import { GeoController } from './geo.controller';
import { SearchModule } from '../../core/search/search.module';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [SearchModule, HttpModule, PrismaModule],
  providers: [GeoService],
  controllers: [GeoController],
  exports: [GeoService],
})
export class GeoModule {}
