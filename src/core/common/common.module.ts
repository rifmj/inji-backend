import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import configuration from '../../app/config/configuration';
import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston/dist/winston.utilities';
import { isLocal } from '../utils/environment';
import * as Joi from 'joi';
import { WinstonModule } from 'nest-winston';

const loggerFormat = isLocal()
  ? winston.format.combine(
      winston.format.timestamp(),
      winston.format.ms(),
      nestWinstonModuleUtilities.format.nestLike(process.env.APP_NAME, {
        prettyPrint: true,
      }),
    )
  : winston.format.combine(
      winston.format.timestamp(),
      winston.format.ms(),
      winston.format.json(),
    );

@Module({
  imports: [
    HttpModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    WinstonModule.forRoot({
      format: winston.format.json(),
      transports: [new winston.transports.Console()],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationOptions: { allowUnknown: true, abortEarly: false },
      validationSchema: Joi.object({
        ENV: Joi.string().valid('test', 'local', 'dev', 'prod'),
        PORT: Joi.number(),
        APP_VERSION: Joi.string(),
        APP_NAME: Joi.string(),
        APP_DESCRIPTION: Joi.string(),
        KEY_DB_HOST: Joi.string(),
        KEY_DB_PORT: Joi.number().port(),
        DATABASE_URL: Joi.string(),
        ORIGIN_HOST: Joi.string(),
        JWT_SECRET: Joi.string(),
        SESSION_SECRET: Joi.string(),
        IMAGE_REPO_NAME: Joi.string(),
        AWS_REGION: Joi.string(),
        AWS_ACCOUNT: Joi.string(),
        TWILIO_ACCOUNT_SID: Joi.string(),
        TWILIO_AUTH_TOKEN: Joi.string(),
        TWILIO_FROM_NUMBER: Joi.string(),
        FIREBASE_PRIVATE_KEY: Joi.string(),
        FIREBASE_PRIVATE_KEY_ID: Joi.string(),
        FIREBASE_CLIENT_X509_CERT_URL: Joi.string(),
        FIREBASE_PROJECT_ID: Joi.string(),
        FIREBASE_CLIENT_ID: Joi.string(),
        FIREBASE_CLIENT_EMAIL: Joi.string(),
        TWILIO_WHATSAPP_SERVICE_SID: Joi.string(),
      }),
    }),
  ],
})
export class CommonModule {}
