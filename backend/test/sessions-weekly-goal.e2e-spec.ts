/**
 * Sessions + WeeklyGoal Integration Tests
 * Using jest-prisma for automatic transaction rollback
 */
import { Test, TestingModule } from '@nestjs/testing';
import { StudySessionsService } from '../src/study-sessions/study-sessions.service';
import { WeeklyGoalService } from '../src/weekly-goal/weekly-goal.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigService } from '../src/config/config.service';
import { createTestUser, createUserConfig } from './helpers/database.helper';

describe('Sessions + WeeklyGoal Integration', () => {
  let studySessionsService: StudySessionsService;
  let weeklyGoalService: WeeklyGoalService;

  beforeEach(async () => {
    const prisma = jestPrisma.client;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudySessionsService,
        WeeklyGoalService,
        { provide: PrismaService, useValue: prisma },
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

  describe('Weekly goal auto-creation', () => {
    it('should create weekly goal with default config when getOrCreateForWeek is called', async () => {
      const user = await createTestUser();
      await createUserConfig(user.id, { targetHours: 25 });

      const weekStart = new Date(Date.UTC(2024, 11, 16));
      const goal = await weeklyGoalService.getOrCreateForWeek(user.id, weekStart);

      expect(goal).toBeDefined();
      expect(goal.userId).toBe(user.id);
      expect(goal.targetHours).toBe(30); // From mocked ConfigService
      expect(goal.isCustom).toBe(false);
    });

    it('should return existing goal if already exists', async () => {
      const user = await createTestUser();
      const weekStart = new Date(Date.UTC(2024, 11, 16));

      const goal1 = await weeklyGoalService.getOrCreateForWeek(user.id, weekStart);
      const goal2 = await weeklyGoalService.getOrCreateForWeek(user.id, weekStart);

      expect(goal1.id).toBe(goal2.id);
    });
  });

  describe('Weekly progress calculation', () => {
    it('should calculate weekly total from sessions', async () => {
      const user = await createTestUser();

      await studySessionsService.create(user.id, {
        date: '2024-12-16',
        subject: 'Math',
        minutes: 60,
      });

      await studySessionsService.create(user.id, {
        date: '2024-12-18',
        subject: 'Physics',
        minutes: 90,
      });

      await studySessionsService.create(user.id, {
        date: '2024-12-20',
        subject: 'Chemistry',
        minutes: 120,
      });

      const sessions = await studySessionsService.findByDateRange(
        user.id,
        '2024-12-16',
        '2024-12-22',
      );

      const totalMinutes = sessions.reduce((acc, s) => acc + s.minutes, 0);
      const totalHours = totalMinutes / 60;

      expect(totalHours).toBe(4.5);
    });

    it('should calculate progress percentage based on goal', async () => {
      const user = await createTestUser();
      const weekStart = new Date(Date.UTC(2024, 11, 16));

      await weeklyGoalService.getOrCreateForWeek(user.id, weekStart);
      const goal = await weeklyGoalService.update(user.id, weekStart, {
        targetHours: 5,
      });

      await studySessionsService.create(user.id, {
        date: '2024-12-16',
        subject: 'Math',
        minutes: 180,
      });

      const sessions = await studySessionsService.findByDateRange(
        user.id,
        '2024-12-16',
        '2024-12-22',
      );

      const totalHours = sessions.reduce((acc, s) => acc + s.minutes, 0) / 60;
      const progress = (totalHours / goal.targetHours) * 100;

      expect(progress).toBe(60);
    });
  });

  describe('getForDate with weekStartDay', () => {
    it('should find goal for date within the week', async () => {
      const user = await createTestUser();

      const weekStart = new Date(Date.UTC(2024, 11, 16));
      await weeklyGoalService.getOrCreateForWeek(user.id, weekStart);
      await weeklyGoalService.update(user.id, weekStart, { targetHours: 40 });

      const goal = await weeklyGoalService.getForDate(
        user.id,
        new Date(Date.UTC(2024, 11, 18)),
        1,
      );

      expect(goal).toBeDefined();
      expect(goal?.targetHours).toBe(40);
    });
  });
});
