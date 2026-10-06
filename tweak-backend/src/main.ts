import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { text } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const corsOrigins = (
    process.env.CORS_ORIGINS || 'http://127.0.0.1:4200,http://localhost:4200'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.use('/api/caldav', text({ type: () => true, limit: '1mb' }));
  app.use('/api/caldav', (req, res, next) => {
    if (req.method !== 'OPTIONS') {
      return next();
    }
    res.set({
      DAV: '1, 3, calendar-access',
      Allow: 'OPTIONS, GET, HEAD, PROPFIND, REPORT, PUT, DELETE',
    });
    res.status(200).end();
  });
  app.enableCors({ origin: corsOrigins });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT || 1337);
}
bootstrap();
