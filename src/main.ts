// @ts-ignore
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, VersioningType } from '@nestjs/common';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { isProd } from './core/utils/environment';
import { ConfigService } from '@nestjs/config';

// import * as session from 'express-session';
// import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const {
    port,
    appVersion,
    sessionSecret,
    appName,
    appDescription,
    originHost,
  } = configService.get('common');

  app.enableCors({
    origin: '*',
    // origin: isProd() ? originHost : '*',
  });

  // app.use(compression());

  app.enableVersioning({
    type: VersioningType.URI,
  });

  // app.use(
  //   session({
  //     secret: sessionSecret,
  //     resave: false,
  //     saveUninitialized: false,
  //   }),
  // );

  if (process.env.ENV === 'dev') {
    const config = new DocumentBuilder()
      .setTitle(appName)
      .setDescription(appDescription)
      .setVersion(appVersion)
      .addBearerAuth({ type: 'http', bearerFormat: 'JWT' }, 'JWT')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  await app.listen(port);

  Logger.log(`${appName} is running on http://localhost:${port}`);
}
bootstrap();
