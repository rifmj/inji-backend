import { Inject, Injectable, Logger } from '@nestjs/common';

import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { SearchService } from '../search/search.service';

export enum LogCtx {
  Auth = 'auth',
  FrappeOrderService = 'frappe-order-service',
  XlsService = 'xls-service',
}

@Injectable()
export class LoggerService extends Logger {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: WinstonLogger,
    private readonly searchService: SearchService,
  ) {
    super();
  }

  d(context: LogCtx, title: string, data: object, ...rest) {
    this.logger.debug(title, { context, data });
    const message = JSON.stringify(
      {
        ...data,
        ...rest,
      },
      null,
      2,
    );
    // this.searchService
    //   ?.writeLog({
    //     message,
    //     context,
    //     title,
    //     timestamp: new Date().toISOString(),
    //   })
    //   .then((r) => r)
    //   .catch((e) => console.info('debug:error', e));
  }

  info(
    message: any,
    context?: string,
    options?: { disableConsole: boolean },
  ): void {
    this.logger.info(message, { context });
    // if (this.searchService?.writeLog) {
    //   this.searchService
    //     .writeLog({
    //       message:
    //         typeof message === 'string'
    //           ? message
    //           : JSON.stringify(message, null, 2),
    //       context,
    //       timestamp: new Date().toISOString(),
    //     })
    //     .then((r) => r)
    //     .catch((e) => console.info('info:error', e));
    // } else {
    //   console.error('Error writing logs', this.searchService);
    // }
    if (options?.disableConsole) {
      return null;
    }
    super.log(message, context);
  }

  error(message: any, trace: string, context?: string): void {
    this.logger.error(
      typeof message === 'string' ? message : JSON.stringify(message),
      { context },
    );
    super.error(message, trace, context);
  }
}
