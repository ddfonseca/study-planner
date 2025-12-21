/**
 * Sessions + WeeklyGoal Integration Tests
 * Tests business logic through services, not Prisma directly
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { StudySessionsService } from '../src/study-sessions/study-sessions.service';
import { WeeklyGoalService } from '../src/weekly-goal/weekly-goal.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigService } from '../src/config/config.service';
import {
  cleanDatabase,
  createTestUser,
  createUserConfig,
} from './helpers/database.helper';

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

describe('Sessions + WeeklyGoal Integration', () => {
  let studySessionsService: StudySessionsService;
  let weeklyGoalService: WeeklyGoalService;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new MockPrismaService();
    await prisma.$connect();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudySessionsService,
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

    studySessionsService = module.get<StudySessionsService>(StudySessionsService);
    weeklyGoalService = module.get<WeeklyGoalService>(WeeklyGoalService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Weekly goal auto-creation', () => {
    it('should create weekly goal with default config when getOrCreateForWeek is called', async () => {
      const user = await createTestUser();
      await createUserConfig(user.id, { targetHours: 25 });

      const weekStart = new Date(Date.UTC(2024, 11, 16)); // Monday
      const goal = await weeklyGoalService.getOrCreateForWeek(user.id, weekStart);

      expect(goal).toBeDefined();
      expect(goal.userId).toBe(user.id);
      expect(goal.targetHours).toBe(30); // From mocked ConfigService
      expect(goal.isCustom).toBe(false);
    });

    it('should return existing goal if already exists', async () => {
      const user = await createTestUser();
      const weekStart = new Date(Date.UTC(2024, 11, 16));

      // Create first goal
      const goal1 = await weeklyGoalService.getOrCreateForWeek(user.id, weekStart);

      // Get again - should return same goal
      const goal2 = await weeklyGoalService.getOrCreateForWeek(user.id, weekStart);

      expect(goal1.id).toBe(goal2.id);
    });
  });

  describe('Weekly progress calculation', () => {
    it('should calculate weekly total from sessions', async () => {
      const user = await createTestUser();

      // Create sessions using service
      await studySessionsService.create(user.id, {
        date: '2024-12-16', // Monday
        subject: 'Math',
        minutes: 60,
      });

      await studySessionsService.create(user.id, {
        date: '2024-12-18', // Wednesday
        subject: 'Physics',
        minutes: 90,
      });

      await studySessionsService.create(user.id, {
        date: '2024-12-20', // Friday
        subject: 'Chemistry',
        minutes: 120,
      });

      // Get sessions for the week using service
      const sessions = await studySessionsService.findByDateRange(
        user.id,
        '2024-12-16',
        '2024-12-22',
      );

      const totalMinutes = sessions.reduce((acc, s) => acc + s.minutes, 0);
      const totalHours = totalMinutes / 60;

      expect(totalHours).toBe(4.5); // 60 + 90 + 120 = 270 min = 4.5h
    });

    it('should calculate progress percentage based on goal', async () => {
      const user = await createTestUser();
      const weekStart = new Date(Date.UTC(2024, 11, 16));

      // Update goal to 5 hours
      await weeklyGoalService.getOrCreateForWeek(user.id, weekStart);
      const goal = await weeklyGoalService.update(user.id, weekStart, {
        targetHours: 5,
      });

      // Create session with 3 hours
      await studySessionsService.create(user.id, {
        date: '2024-12-16',
        subject: 'Math',
        minutes: 180, // 3 hours
      });

      // Get sessions
      const sessions = await studySessionsService.findByDateRange(
        user.id,
        '2024-12-16',
        '2024-12-22',
      );

      const totalHours = sessions.reduce((acc, s) => acc + s.minutes, 0) / 60;
      const progress = (totalHours / goal.targetHours) * 100;

      expect(progress).toBe(60); // 3h / 5h = 60%
    });
  });

  describe('getForDate with weekStartDay', () => {
    it('should find goal for date within the week', async () => {
      const user = await createTestUser();

      // Create goal for week starting Dec 16 (Monday)
      const weekStart = new Date(Date.UTC(2024, 11, 16));
      await weeklyGoalService.getOrCreateForWeek(user.id, weekStart);
      await weeklyGoalService.update(user.id, weekStart, { targetHours: 40 });

      // Query with Wednesday Dec 18 (same week)
      const goal = await weeklyGoalService.getForDate(
        user.id,
        new Date(Date.UTC(2024, 11, 18)),
        1, // Monday start
      );

      expect(goal).toBeDefined();
      expect(goal?.targetHours).toBe(40);
    });
  });
});
