import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { PrismaModule } from './prisma/prisma.module';
import { auth } from './auth/auth.config';
import { StudySessionsModule } from './study-sessions/study-sessions.module';
import { UserConfigModule } from './config/config.module';
import { WeeklyGoalModule } from './weekly-goal/weekly-goal.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Structured logging
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(
              ({
                timestamp,
                level,
                message,
                context,
              }: {
                timestamp?: string;
                level: string;
                message: string;
                context?: string;
              }) => {
                return `${timestamp ?? ''} [${context ?? 'App'}] ${level}: ${message}`;
              },
            ),
          ),
        }),
      ],
    }),
    // Rate limiting: 100 requests per minute, 10 per second
    ThrottlerModule.forRoot({
      throttlers: [
        { ttl: 60000, limit: 100 },
        { ttl: 1000, limit: 10 },
      ],
    }),
    PrismaModule,
    AuthModule.forRoot({ auth, disableControllers: true }),
    StudySessionsModule,
    UserConfigModule,
    WeeklyGoalModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
