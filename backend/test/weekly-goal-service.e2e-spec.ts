/**
 * WeeklyGoalService Tests
 * TDD: Tests written BEFORE implementation
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { WeeklyGoalService } from '../src/weekly-goal/weekly-goal.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigService } from '../src/config/config.service';
import {
  cleanDatabase,
  createTestUser,
  createUserConfig,
} from './helpers/database.helper';

// Mock PrismaService
class MockPrismaService extends PrismaClient {
  constructor() {
    super({
      datasources: {
        db: {
          url: 'postgresql://test:test@localhost:5433/study_planner_test?schema=public',
        },
      },
    });
  }
}

describe('WeeklyGoalService', () => {
  let service: WeeklyGoalService;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new MockPrismaService();
    await prisma.$connect();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeeklyGoalService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: ConfigService,
          useValue: {
            findByUserId: jest.fn().mockResolvedValue({
              targetHours: 30,
              weekStartDay: 1,
            }),
          },
        },
      ],
    }).compile();

    service = module.get<WeeklyGoalService>(WeeklyGoalService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('calculateWeekStart', () => {
    it('should return Monday for a Monday date', () => {
      // December 16, 2024 is a Monday - use UTC date
      const monday = new Date(Date.UTC(2024, 11, 16)); // Month is 0-indexed
      const result = service.calculateWeekStart(monday, 1); // 1 = Monday start

      expect(result.toISOString().split('T')[0]).toBe('2024-12-16');
    });

    it('should return previous Monday for a Wednesday date', () => {
      // December 18, 2024 is a Wednesday
      const wednesday = new Date(Date.UTC(2024, 11, 18));
      const result = service.calculateWeekStart(wednesday, 1);

      expect(result.toISOString().split('T')[0]).toBe('2024-12-16');
    });

    it('should return previous Monday for a Sunday date', () => {
      // December 22, 2024 is a Sunday
      const sunday = new Date(Date.UTC(2024, 11, 22));
      const result = service.calculateWeekStart(sunday, 1);

      expect(result.toISOString().split('T')[0]).toBe('2024-12-16');
    });

    it('should return Sunday for weekStartDay=0 (Sunday start)', () => {
      // December 18, 2024 is a Wednesday, previous Sunday is Dec 15
      const wednesday = new Date(Date.UTC(2024, 11, 18));
      const result = service.calculateWeekStart(wednesday, 0);

      expect(result.toISOString().split('T')[0]).toBe('2024-12-15');
    });
  });

  describe('getOrCreateForWeek', () => {
    it('should create goal with default values if not exists', async () => {
      const user = await createTestUser();
      await createUserConfig(user.id, { targetHours: 30 });

      // Use UTC date to avoid timezone issues
      const weekStart = new Date(Date.UTC(2024, 11, 16));
      const goal = await service.getOrCreateForWeek(user.id, weekStart);

      expect(goal).toBeDefined();
      expect(goal.userId).toBe(user.id);
      expect(goal.targetHours).toBe(30);
      expect(goal.isCustom).toBe(false);
    });

    it('should return existing goal if exists', async () => {
      const user = await createTestUser();
      // Use UTC date to match what the service stores
      const weekStart = new Date(Date.UTC(2024, 11, 16));

      // Create goal directly with UTC date
      await prisma.weeklyGoal.create({
        data: {
          userId: user.id,
          weekStart,
          targetHours: 35,
          isCustom: true,
        },
      });

      const goal = await service.getOrCreateForWeek(user.id, weekStart);

      expect(goal.targetHours).toBe(35);
      expect(goal.isCustom).toBe(true);
    });
  });

  describe('getForDate', () => {
    it('should return goal for the week containing the date', async () => {
      const user = await createTestUser();
      await createUserConfig(user.id);

      // Create goal for week of Dec 16 (UTC)
      await prisma.weeklyGoal.create({
        data: {
          userId: user.id,
          weekStart: new Date(Date.UTC(2024, 11, 16)),
          targetHours: 35,
          isCustom: true,
        },
      });

      // Query with Wednesday Dec 18 (same week) - UTC
      const goal = await service.getForDate(
        user.id,
        new Date(Date.UTC(2024, 11, 18)),
        1,
      );

      expect(goal).toBeDefined();
      expect(goal?.targetHours).toBe(35);
    });
  });

  describe('update', () => {
    it('should allow updating current week goal', async () => {
      const user = await createTestUser();

      // Get current week's Monday using UTC
      const now = new Date();
      const currentWeekStart = service.calculateWeekStart(now, 1);

      // Create goal for current week - use the exact same date object
      await prisma.weeklyGoal.create({
        data: {
          userId: user.id,
          weekStart: currentWeekStart,
          targetHours: 30,
          isCustom: false,
        },
      });

      // Update should succeed - pass the same date
      const updated = await service.update(user.id, currentWeekStart, {
        targetHours: 40,
      });

      expect(updated.targetHours).toBe(40);
      expect(updated.isCustom).toBe(true);
    });

    it('should allow updating future week goal', async () => {
      const user = await createTestUser();

      // Calculate a future week start (14 days ahead to ensure it's next week)
      const now = new Date();
      const futureDate = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 14),
      );
      const futureWeekStart = service.calculateWeekStart(futureDate, 1);

      // Create goal for future week
      await prisma.weeklyGoal.create({
        data: {
          userId: user.id,
          weekStart: futureWeekStart,
          targetHours: 30,
          isCustom: false,
        },
      });

      // Update should succeed
      const updated = await service.update(user.id, futureWeekStart, {
        targetHours: 45,
      });

      expect(updated.targetHours).toBe(45);
    });

    it('should allow updating past week goal', async () => {
      const user = await createTestUser();

      // A Monday in the past (UTC)
      const pastWeekStart = new Date(Date.UTC(2024, 0, 1)); // Jan 1, 2024 is a Monday

      // Create goal for past week
      await prisma.weeklyGoal.create({
        data: {
          userId: user.id,
          weekStart: pastWeekStart,
          targetHours: 30,
          isCustom: false,
        },
      });

      // Update should succeed
      const updated = await service.update(user.id, pastWeekStart, {
        targetHours: 40,
      });

      expect(updated.targetHours).toBe(40);
      expect(updated.isCustom).toBe(true);
    });
  });

  describe('getForDateRange', () => {
    it('should return all goals within date range', async () => {
      const user = await createTestUser();

      // Create multiple goals with UTC dates
      await prisma.weeklyGoal.createMany({
        data: [
          {
            userId: user.id,
            weekStart: new Date(Date.UTC(2024, 11, 2)),
            targetHours: 30,
            isCustom: false,
          },
          {
            userId: user.id,
            weekStart: new Date(Date.UTC(2024, 11, 9)),
            targetHours: 35,
            isCustom: true,
          },
          {
            userId: user.id,
            weekStart: new Date(Date.UTC(2024, 11, 16)),
            targetHours: 30,
            isCustom: false,
          },
          {
            userId: user.id,
            weekStart: new Date(Date.UTC(2024, 11, 23)),
            targetHours: 40,
            isCustom: true,
          },
        ],
      });

      const goals = await service.getForDateRange(
        user.id,
        new Date(Date.UTC(2024, 11, 5)),
        new Date(Date.UTC(2024, 11, 20)),
      );

      // Should include Dec 9, Dec 16 (within range)
      expect(goals.length).toBeGreaterThanOrEqual(2);
    });
  });
});
