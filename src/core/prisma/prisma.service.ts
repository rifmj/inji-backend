import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

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
