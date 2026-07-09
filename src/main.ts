// @ts-ignore
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, VersioningType } from '@nestjs/common';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded } from 'express';
import type { Request } from 'express';

// import * as session from 'express-session';
// import * as compression from 'compression';

// Payment-webhook signature checks (TipTopPay HMAC) need the exact bytes that
// were signed, not the re-serialized parsed object. Stash the raw buffer on the
// request so TipTopPaySignatureGuard can recompute the HMAC over it.
const rawBodySaver = (req: Request, _res: unknown, buf: Buffer) => {
  if (buf?.length) {
    (req as Request & { rawBody?: Buffer }).rawBody = buf;
  }
};

async function bootstrap() {
  // Disable Nest's built-in body parser so we can register express parsers with
  // a `verify` hook that captures the raw body (Nest 8 has no `rawBody` option).
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(json({ verify: rawBodySaver }));
  app.use(urlencoded({ extended: true, verify: rawBodySaver }));

  const configService = app.get(ConfigService);
  const { port, appVersion, appName, appDescription } =
    configService.get('common');

  app.enableCors({
    origin: '*',
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
