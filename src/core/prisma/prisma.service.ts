import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from 'prisma/prisma-client/index';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleInit
{
  onModuleInit(): any {
    Logger.log('Prisma module initalized');
  }

  onModuleDestroy(): any {
    this.$disconnect();
  }
}
