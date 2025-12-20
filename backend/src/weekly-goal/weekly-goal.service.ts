/**
 * WeeklyGoal Service
 * Manages weekly study goals
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../config/config.service';
import { WeeklyGoal } from '@prisma/client';
import { UpdateWeeklyGoalDto } from './dto';

@Injectable()
export class WeeklyGoalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Calculate the start of the week for a given date
   * @param date - Any date
   * @param weekStartDay - 0=Sunday, 1=Monday, ..., 6=Saturday
   * @returns Date of the week start (UTC normalized)
   */
  calculateWeekStart(date: Date, weekStartDay: number): Date {
    // Create date in UTC - use UTC methods to avoid timezone issues
    const d = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );

    const currentDay = d.getUTCDay(); // 0=Sun, 1=Mon, ...
    let diff = currentDay - weekStartDay;

    if (diff < 0) {
      diff += 7;
    }

    d.setUTCDate(d.getUTCDate() - diff);
    return d;
  }

  /**
   * Get or create weekly goal for a specific week
   * If not exists, creates with user's default config values
   */
  async getOrCreateForWeek(
    userId: string,
    weekStart: Date,
  ): Promise<WeeklyGoal> {
    // Normalize to UTC start of day - use UTC methods to avoid timezone issues
    const normalizedWeekStart = new Date(
      Date.UTC(weekStart.getUTCFullYear(), weekStart.getUTCMonth(), weekStart.getUTCDate()),
    );

    // Try to find existing
    const existing = await this.prisma.weeklyGoal.findUnique({
      where: {
        userId_weekStart: {
          userId,
          weekStart: normalizedWeekStart,
        },
      },
    });

    if (existing) {
      return existing;
    }

    // Get user's default config
    const userConfig = await this.configService.findByUserId(userId);

    // Create new goal with defaults
    return this.prisma.weeklyGoal.create({
      data: {
        userId,
        weekStart: normalizedWeekStart,
        targetHours: userConfig.targetHours,
        isCustom: false,
      },
    });
  }

  /**
   * Get weekly goal for a specific date
   * Calculates which week the date belongs to
   */
  async getForDate(
    userId: string,
    date: Date,
    weekStartDay: number,
  ): Promise<WeeklyGoal | null> {
    const weekStart = this.calculateWeekStart(date, weekStartDay);

    return this.prisma.weeklyGoal.findUnique({
      where: {
        userId_weekStart: {
          userId,
          weekStart,
        },
      },
    });
  }

  /**
   * Update weekly goal
   */
  async update(
    userId: string,
    weekStart: Date,
    data: UpdateWeeklyGoalDto,
  ): Promise<WeeklyGoal> {
    // Normalize to UTC - use UTC methods to avoid timezone issues
    const normalizedWeekStart = new Date(
      Date.UTC(weekStart.getUTCFullYear(), weekStart.getUTCMonth(), weekStart.getUTCDate()),
    );

    return this.prisma.weeklyGoal.update({
      where: {
        userId_weekStart: {
          userId,
          weekStart: normalizedWeekStart,
        },
      },
      data: {
        ...data,
        isCustom: true,
      },
    });
  }

  /**
   * Get all weekly goals within a date range
   */
  async getForDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<WeeklyGoal[]> {
    return this.prisma.weeklyGoal.findMany({
      where: {
        userId,
        weekStart: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        weekStart: 'asc',
      },
    });
  }

  /**
   * Find weekly goal by user and week start
   */
  async findByUserAndWeek(
    userId: string,
    weekStart: Date,
  ): Promise<WeeklyGoal | null> {
    const normalizedWeekStart = new Date(weekStart);
    normalizedWeekStart.setHours(0, 0, 0, 0);

    return this.prisma.weeklyGoal.findUnique({
      where: {
        userId_weekStart: {
          userId,
          weekStart: normalizedWeekStart,
        },
      },
    });
  }
}
