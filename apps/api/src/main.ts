import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
  app.enableCors();

  // Serve uploaded avatars from /api/avatars/*
  app.useStaticAssets(join(process.cwd(), 'apps', 'api', 'public'), {
    prefix: '/api/',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
