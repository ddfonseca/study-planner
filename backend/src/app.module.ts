import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    PrismaModule,
    AuthModule.forRoot({ auth, disableControllers: true }),
    StudySessionsModule,
    UserConfigModule,
    WeeklyGoalModule,
  ],
})
export class AppModule {}
