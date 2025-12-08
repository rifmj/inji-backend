import { Module, OnModuleInit } from '@nestjs/common';
import { LoggerService } from './core/shared/logger.service';
import { CoreModule } from './core/core.module';
import { AppModule as InjiAppModule } from './app/app.module';
import { SearchModule } from './core/search/search.module';

@Module({
  imports: [CoreModule, SearchModule, InjiAppModule],
  controllers: [],
  providers: [LoggerService],
})
export class AppModule implements OnModuleInit {
  constructor(private loggerService: LoggerService) {}
  onModuleInit(): any {
    if (process.env.ENV !== 'dev') {
      this.loggerService.info('AppModule is initialized', 'app');
    }
  }
}
