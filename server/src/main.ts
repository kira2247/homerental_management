import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { appLogger } from './common/logging';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Thêm cookie-parser middleware
  app.use(cookieParser());
  
  // Thiết lập static directory
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });
  
  // Cấu hình CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001', 'file://'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Debug-Info', 'Cookie', 'Origin'],
    exposedHeaders: ['Set-Cookie'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  
  // Determine environment
  const isDev = process.env.NODE_ENV !== 'production';
  
  // Validation pipe for class-validator with environment-specific settings
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  
  // Cấu hình Swagger
  if (isDev) {
    const config = new DocumentBuilder()
      .setTitle('Rental Management API')
      .setDescription('The Rental Management API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }
  
  // Prefix for all routes
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  appLogger.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap(); 