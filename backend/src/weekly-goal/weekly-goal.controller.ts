/**
 * WeeklyGoal Controller
 * Endpoints for managing weekly study goals
 */
import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { WeeklyGoalService } from './weekly-goal.service';
import { UpdateWeeklyGoalDto, DateRangeDto } from './dto';

@Controller('api/weekly-goals')
export class WeeklyGoalController {
  constructor(private readonly weeklyGoalService: WeeklyGoalService) {}

  /**
   * Get weekly goal for a specific week and workspace
   * Creates with defaults if not exists
   * @param workspaceId - Required workspace ID
   */
  @Get(':weekStart')
  async getForWeek(
    @Session() session: UserSession,
    @Param('weekStart') weekStartStr: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    const userId = session.user.id;
    const weekStart = this.parseWeekStart(weekStartStr);

    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    return this.weeklyGoalService.getOrCreateForWeek(userId, workspaceId, weekStart);
  }

  /**
   * Update weekly goal for a specific week and workspace
   * @param workspaceId - Required workspace ID
   */
  @Put(':weekStart')
  async update(
    @Session() session: UserSession,
    @Param('weekStart') weekStartStr: string,
    @Query('workspaceId') workspaceId: string,
    @Body() updateDto: UpdateWeeklyGoalDto,
  ) {
    const userId = session.user.id;
    const weekStart = this.parseWeekStart(weekStartStr);

    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    return this.weeklyGoalService.update(userId, workspaceId, weekStart, updateDto);
  }

  /**
   * Get all weekly goals within a date range
   * @param workspaceId - Optional, can be "all" for all workspaces
   */
  @Get()
  async getForDateRange(
    @Session() session: UserSession,
    @Query() query: DateRangeDto,
  ) {
    const userId = session.user.id;

    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days ago

    const endDate = query.endDate
      ? new Date(query.endDate)
      : new Date(); // Default: now

    return this.weeklyGoalService.getForDateRange(userId, query.workspaceId, startDate, endDate);
  }

  /**
   * Parse weekStart string to UTC Date
   */
  private parseWeekStart(weekStartStr: string): Date {
    // Parse YYYY-MM-DD string to UTC date
    const parts = weekStartStr.split('-');
    if (parts.length !== 3) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed
    const day = parseInt(parts[2], 10);

    return new Date(Date.UTC(year, month, day));
  }
}
