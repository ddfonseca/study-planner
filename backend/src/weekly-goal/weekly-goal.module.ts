/**
 * WeeklyGoal Module
 */
import { Module } from '@nestjs/common';
import { WeeklyGoalController } from './weekly-goal.controller';
import { WeeklyGoalService } from './weekly-goal.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UserConfigModule } from '../config/config.module';

@Module({
  imports: [PrismaModule, UserConfigModule],
  controllers: [WeeklyGoalController],
  providers: [WeeklyGoalService],
  exports: [WeeklyGoalService],
})
export class WeeklyGoalModule {}
