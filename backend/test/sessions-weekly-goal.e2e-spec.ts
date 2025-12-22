/**
 * Sessions + WeeklyGoal Integration Tests
 * Using jest-prisma for automatic transaction rollback
 */
import { Test, TestingModule } from '@nestjs/testing';
import { StudySessionsService } from '../src/study-sessions/study-sessions.service';
import { WeeklyGoalService } from '../src/weekly-goal/weekly-goal.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigService } from '../src/config/config.service';
import { createUserConfig, createTestUserWithWorkspace } from './helpers/database.helper';

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
      const { user, workspace } = await createTestUserWithWorkspace();
      await createUserConfig(user.id, { targetHours: 25 });

      const weekStart = new Date(Date.UTC(2024, 11, 16));
      const goal = await weeklyGoalService.getOrCreateForWeek(user.id, workspace.id, weekStart);

      expect(goal).toBeDefined();
      expect(goal.userId).toBe(user.id);
      expect(goal.workspaceId).toBe(workspace.id);
      expect(goal.targetHours).toBe(30); // From mocked ConfigService
      expect(goal.isCustom).toBe(false);
    });

    it('should return existing goal if already exists', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const weekStart = new Date(Date.UTC(2024, 11, 16));

      const goal1 = await weeklyGoalService.getOrCreateForWeek(user.id, workspace.id, weekStart);
      const goal2 = await weeklyGoalService.getOrCreateForWeek(user.id, workspace.id, weekStart);

      expect(goal1.id).toBe(goal2.id);
    });
  });

  describe('Weekly progress calculation', () => {
    it('should calculate weekly total from sessions', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      await studySessionsService.create(user.id, {
        workspaceId: workspace.id,
        date: '2024-12-16',
        subject: 'Math',
        minutes: 60,
      });

      await studySessionsService.create(user.id, {
        workspaceId: workspace.id,
        date: '2024-12-18',
        subject: 'Physics',
        minutes: 90,
      });

      await studySessionsService.create(user.id, {
        workspaceId: workspace.id,
        date: '2024-12-20',
        subject: 'Chemistry',
        minutes: 120,
      });

      const sessions = await studySessionsService.findByDateRange(
        user.id,
        workspace.id,
        '2024-12-16',
        '2024-12-22',
      );

      const totalMinutes = sessions.reduce((acc, s) => acc + s.minutes, 0);
      const totalHours = totalMinutes / 60;

      expect(totalHours).toBe(4.5);
    });

    it('should calculate progress percentage based on goal', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const weekStart = new Date(Date.UTC(2024, 11, 16));

      await weeklyGoalService.getOrCreateForWeek(user.id, workspace.id, weekStart);
      const goal = await weeklyGoalService.update(user.id, workspace.id, weekStart, {
        targetHours: 5,
      });

      await studySessionsService.create(user.id, {
        workspaceId: workspace.id,
        date: '2024-12-16',
        subject: 'Math',
        minutes: 180,
      });

      const sessions = await studySessionsService.findByDateRange(
        user.id,
        workspace.id,
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
      const { user, workspace } = await createTestUserWithWorkspace();

      const weekStart = new Date(Date.UTC(2024, 11, 16));
      await weeklyGoalService.getOrCreateForWeek(user.id, workspace.id, weekStart);
      await weeklyGoalService.update(user.id, workspace.id, weekStart, { targetHours: 40 });

      const goal = await weeklyGoalService.getForDate(
        user.id,
        workspace.id,
        new Date(Date.UTC(2024, 11, 18)),
        1,
      );

      expect(goal).toBeDefined();
      expect(goal?.targetHours).toBe(40);
    });
  });

  describe('Workspace isolation in weekly progress', () => {
    it('should calculate progress only for selected workspace', async () => {
      const { user, workspace: workspace1 } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;
      const workspace2 = await prisma.workspace.create({
        data: {
          userId: user.id,
          name: 'Work',
          color: '#ff0000',
          isDefault: false,
        },
      });

      await studySessionsService.create(user.id, {
        workspaceId: workspace1.id,
        date: '2024-12-16',
        subject: 'Math',
        minutes: 60,
      });

      await studySessionsService.create(user.id, {
        workspaceId: workspace2.id,
        date: '2024-12-16',
        subject: 'Work Project',
        minutes: 120,
      });

      const workspace1Sessions = await studySessionsService.findByDateRange(
        user.id,
        workspace1.id,
        '2024-12-16',
        '2024-12-22',
      );

      const workspace2Sessions = await studySessionsService.findByDateRange(
        user.id,
        workspace2.id,
        '2024-12-16',
        '2024-12-22',
      );

      const allSessions = await studySessionsService.findByDateRange(
        user.id,
        'all',
        '2024-12-16',
        '2024-12-22',
      );

      expect(workspace1Sessions.reduce((acc, s) => acc + s.minutes, 0)).toBe(60);
      expect(workspace2Sessions.reduce((acc, s) => acc + s.minutes, 0)).toBe(120);
      expect(allSessions.reduce((acc, s) => acc + s.minutes, 0)).toBe(180);
    });
  });
});
