import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { PrismaModule } from './prisma/prisma.module';
import { auth } from './auth/auth.config';
import { WorkSessionModule } from './work-session/work-session.module';
import { UserConfigModule } from './config/config.module';
import { WeeklyGoalModule } from './weekly-goal/weekly-goal.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { FocusCycleModule } from './focus-cycle/focus-cycle.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { MercadoPagoModule } from './mercadopago/mercadopago.module';
import { ScratchpadNotesModule } from './scratchpad-notes/scratchpad-notes.module';
import { TaskModule } from './task/task.module';
import { CategoryModule } from './category/category.module';
import { ProjectModule } from './project/project.module';

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
    // Rate limiting: 300 requests per minute, 30 per second
    ThrottlerModule.forRoot({
      throttlers: [
        { ttl: 60000, limit: 300 },
        { ttl: 1000, limit: 30 },
      ],
    }),
    PrismaModule,
    AuthModule.forRoot({ auth, disableControllers: true }),
    WorkSessionModule,
    UserConfigModule,
    WeeklyGoalModule,
    WorkspaceModule,
    FocusCycleModule,
    SubscriptionModule,
    MercadoPagoModule,
    ScratchpadNotesModule,
    TaskModule,
    CategoryModule,
    ProjectModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
