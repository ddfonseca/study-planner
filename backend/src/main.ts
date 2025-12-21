import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { toNodeHandler } from 'better-auth/node';
import * as express from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { auth } from './auth/auth.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Disabled for Better Auth compatibility
  });

  // Use Winston logger
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Security headers
  app.use(helmet());

  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const expressApp = app.getHttpAdapter().getInstance();
  const authHandler = toNodeHandler(auth);

  // Handle Better Auth routes first (before body parser)
  expressApp.use((req: any, res: any, next: any) => {
    if (req.path.startsWith('/api/auth')) {
      return authHandler(req, res);
    }
    next();
  });

  // Enable body parser for all other routes
  expressApp.use(express.json());
  expressApp.use(express.urlencoded({ extended: true }));

  const port = process.env.PORT || 3000;
  await app.listen(port);

  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  logger.log(`Backend running on http://localhost:${port}`, 'Bootstrap');
  logger.log(`API available at http://localhost:${port}/api`, 'Bootstrap');
}
bootstrap();
