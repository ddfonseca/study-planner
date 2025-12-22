/**
 * WeeklyGoalService Tests
 * Using jest-prisma for automatic transaction rollback
 */
import { Test, TestingModule } from '@nestjs/testing';
import { WeeklyGoalService } from '../src/weekly-goal/weekly-goal.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigService } from '../src/config/config.service';
import { createTestUser, createUserConfig, createTestUserWithWorkspace, createTestWorkspace } from './helpers/database.helper';

describe('WeeklyGoalService', () => {
  let service: WeeklyGoalService;

  beforeEach(async () => {
    const prisma = jestPrisma.client;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
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

    service = module.get<WeeklyGoalService>(WeeklyGoalService);
  });

  describe('calculateWeekStart', () => {
    it('should return Monday for a Monday date', () => {
      const monday = new Date(Date.UTC(2024, 11, 16));
      const result = service.calculateWeekStart(monday, 1);

      expect(result.toISOString().split('T')[0]).toBe('2024-12-16');
    });

    it('should return previous Monday for a Wednesday date', () => {
      const wednesday = new Date(Date.UTC(2024, 11, 18));
      const result = service.calculateWeekStart(wednesday, 1);

      expect(result.toISOString().split('T')[0]).toBe('2024-12-16');
    });

    it('should return previous Monday for a Sunday date', () => {
      const sunday = new Date(Date.UTC(2024, 11, 22));
      const result = service.calculateWeekStart(sunday, 1);

      expect(result.toISOString().split('T')[0]).toBe('2024-12-16');
    });

    it('should return previous Monday for a Saturday date', () => {
      const saturday = new Date(Date.UTC(2024, 11, 21));
      const result = service.calculateWeekStart(saturday, 1);

      expect(result.toISOString().split('T')[0]).toBe('2024-12-16');
    });

    it('should return Sunday for weekStartDay=0 (Sunday start)', () => {
      const wednesday = new Date(Date.UTC(2024, 11, 18));
      const result = service.calculateWeekStart(wednesday, 0);

      expect(result.toISOString().split('T')[0]).toBe('2024-12-15');
    });

    it('should handle year boundary correctly', () => {
      const newYear = new Date(Date.UTC(2025, 0, 1));
      const result = service.calculateWeekStart(newYear, 1);

      expect(result.toISOString().split('T')[0]).toBe('2024-12-30');
    });
  });

  describe('getOrCreateForWeek', () => {
    it('should create goal with default values if not exists', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      await createUserConfig(user.id, { targetHours: 30 });

      const weekStart = new Date(Date.UTC(2024, 11, 16));
      const goal = await service.getOrCreateForWeek(user.id, workspace.id, weekStart);

      expect(goal).toBeDefined();
      expect(goal.userId).toBe(user.id);
      expect(goal.workspaceId).toBe(workspace.id);
      expect(goal.targetHours).toBe(30);
      expect(goal.isCustom).toBe(false);
    });

    it('should return existing goal if exists', async () => {
      const prisma = jestPrisma.client;
      const { user, workspace } = await createTestUserWithWorkspace();
      const weekStart = new Date(Date.UTC(2024, 11, 16));

      await prisma.weeklyGoal.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          weekStart,
          targetHours: 35,
          isCustom: true,
        },
      });

      const goal = await service.getOrCreateForWeek(user.id, workspace.id, weekStart);

      expect(goal.targetHours).toBe(35);
      expect(goal.isCustom).toBe(true);
    });

    it('should create separate goals for different workspaces', async () => {
      const { user, workspace: workspace1 } = await createTestUserWithWorkspace();
      const workspace2 = await createTestWorkspace(user.id, { name: 'Work' });
      await createUserConfig(user.id, { targetHours: 30 });

      const weekStart = new Date(Date.UTC(2024, 11, 16));

      const goal1 = await service.getOrCreateForWeek(user.id, workspace1.id, weekStart);
      const goal2 = await service.getOrCreateForWeek(user.id, workspace2.id, weekStart);

      expect(goal1.id).not.toBe(goal2.id);
      expect(goal1.workspaceId).toBe(workspace1.id);
      expect(goal2.workspaceId).toBe(workspace2.id);
    });
  });

  describe('getForDate', () => {
    it('should return goal for the week containing the date', async () => {
      const prisma = jestPrisma.client;
      const { user, workspace } = await createTestUserWithWorkspace();
      await createUserConfig(user.id);

      await prisma.weeklyGoal.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          weekStart: new Date(Date.UTC(2024, 11, 16)),
          targetHours: 35,
          isCustom: true,
        },
      });

      const goal = await service.getForDate(
        user.id,
        workspace.id,
        new Date(Date.UTC(2024, 11, 18)),
        1,
      );

      expect(goal).toBeDefined();
      expect(goal?.targetHours).toBe(35);
    });

    it('should return null when goal does not exist for week', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      const goal = await service.getForDate(
        user.id,
        workspace.id,
        new Date(Date.UTC(2024, 11, 18)),
        1,
      );

      expect(goal).toBeNull();
    });
  });

  describe('update', () => {
    it('should allow updating current week goal', async () => {
      const prisma = jestPrisma.client;
      const { user, workspace } = await createTestUserWithWorkspace();

      const now = new Date();
      const currentWeekStart = service.calculateWeekStart(now, 1);

      await prisma.weeklyGoal.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          weekStart: currentWeekStart,
          targetHours: 30,
          isCustom: false,
        },
      });

      const updated = await service.update(user.id, workspace.id, currentWeekStart, {
        targetHours: 40,
      });

      expect(updated.targetHours).toBe(40);
      expect(updated.isCustom).toBe(true);
    });

    it('should allow updating future week goal', async () => {
      const prisma = jestPrisma.client;
      const { user, workspace } = await createTestUserWithWorkspace();

      const now = new Date();
      const futureDate = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 14),
      );
      const futureWeekStart = service.calculateWeekStart(futureDate, 1);

      await prisma.weeklyGoal.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          weekStart: futureWeekStart,
          targetHours: 30,
          isCustom: false,
        },
      });

      const updated = await service.update(user.id, workspace.id, futureWeekStart, {
        targetHours: 45,
      });

      expect(updated.targetHours).toBe(45);
    });

    it('should allow updating past week goal', async () => {
      const prisma = jestPrisma.client;
      const { user, workspace } = await createTestUserWithWorkspace();

      const pastWeekStart = new Date(Date.UTC(2024, 0, 1));

      await prisma.weeklyGoal.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          weekStart: pastWeekStart,
          targetHours: 30,
          isCustom: false,
        },
      });

      const updated = await service.update(user.id, workspace.id, pastWeekStart, {
        targetHours: 40,
      });

      expect(updated.targetHours).toBe(40);
      expect(updated.isCustom).toBe(true);
    });
  });

  describe('getForDateRange', () => {
    it('should return all goals within date range for a workspace', async () => {
      const prisma = jestPrisma.client;
      const { user, workspace } = await createTestUserWithWorkspace();

      await prisma.weeklyGoal.createMany({
        data: [
          { userId: user.id, workspaceId: workspace.id, weekStart: new Date(Date.UTC(2024, 11, 2)), targetHours: 30, isCustom: false },
          { userId: user.id, workspaceId: workspace.id, weekStart: new Date(Date.UTC(2024, 11, 9)), targetHours: 35, isCustom: true },
          { userId: user.id, workspaceId: workspace.id, weekStart: new Date(Date.UTC(2024, 11, 16)), targetHours: 30, isCustom: false },
          { userId: user.id, workspaceId: workspace.id, weekStart: new Date(Date.UTC(2024, 11, 23)), targetHours: 40, isCustom: true },
        ],
      });

      const goals = await service.getForDateRange(
        user.id,
        workspace.id,
        new Date(Date.UTC(2024, 11, 5)),
        new Date(Date.UTC(2024, 11, 20)),
      );

      expect(goals.length).toBeGreaterThanOrEqual(2);
    });

    it('should return goals from all workspaces when workspaceId is "all"', async () => {
      const prisma = jestPrisma.client;
      const { user, workspace: workspace1 } = await createTestUserWithWorkspace();
      const workspace2 = await createTestWorkspace(user.id, { name: 'Work' });

      await prisma.weeklyGoal.createMany({
        data: [
          { userId: user.id, workspaceId: workspace1.id, weekStart: new Date(Date.UTC(2024, 11, 9)), targetHours: 30, isCustom: false },
          { userId: user.id, workspaceId: workspace2.id, weekStart: new Date(Date.UTC(2024, 11, 9)), targetHours: 40, isCustom: true },
        ],
      });

      const goals = await service.getForDateRange(
        user.id,
        'all',
        new Date(Date.UTC(2024, 11, 1)),
        new Date(Date.UTC(2024, 11, 31)),
      );

      expect(goals).toHaveLength(2);
    });

    it('should return empty array when no goals in range', async () => {
      const prisma = jestPrisma.client;
      const { user, workspace } = await createTestUserWithWorkspace();

      await prisma.weeklyGoal.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          weekStart: new Date(Date.UTC(2024, 11, 16)),
          targetHours: 30,
          isCustom: false,
        },
      });

      const goals = await service.getForDateRange(
        user.id,
        workspace.id,
        new Date(Date.UTC(2024, 0, 1)),
        new Date(Date.UTC(2024, 0, 31)),
      );

      expect(goals).toHaveLength(0);
    });

    it('should order goals by weekStart ascending', async () => {
      const prisma = jestPrisma.client;
      const { user, workspace } = await createTestUserWithWorkspace();

      await prisma.weeklyGoal.createMany({
        data: [
          { userId: user.id, workspaceId: workspace.id, weekStart: new Date(Date.UTC(2024, 11, 23)), targetHours: 40, isCustom: true },
          { userId: user.id, workspaceId: workspace.id, weekStart: new Date(Date.UTC(2024, 11, 9)), targetHours: 35, isCustom: true },
          { userId: user.id, workspaceId: workspace.id, weekStart: new Date(Date.UTC(2024, 11, 16)), targetHours: 30, isCustom: false },
        ],
      });

      const goals = await service.getForDateRange(
        user.id,
        workspace.id,
        new Date(Date.UTC(2024, 11, 1)),
        new Date(Date.UTC(2024, 11, 31)),
      );

      expect(goals[0].targetHours).toBe(35); // Dec 9
      expect(goals[1].targetHours).toBe(30); // Dec 16
      expect(goals[2].targetHours).toBe(40); // Dec 23
    });
  });

  describe('User isolation', () => {
    it('should not return goals from other users', async () => {
      const prisma = jestPrisma.client;
      const { user: user1, workspace: workspace1 } = await createTestUserWithWorkspace({ email: 'user1@test.com' });
      const { user: user2, workspace: workspace2 } = await createTestUserWithWorkspace({ email: 'user2@test.com' });
      const weekStart = new Date(Date.UTC(2024, 11, 16));

      await prisma.weeklyGoal.create({
        data: { userId: user1.id, workspaceId: workspace1.id, weekStart, targetHours: 20, isCustom: false },
      });

      await prisma.weeklyGoal.create({
        data: { userId: user2.id, workspaceId: workspace2.id, weekStart, targetHours: 40, isCustom: true },
      });

      const goal1 = await service.getForDate(user1.id, workspace1.id, weekStart, 1);
      const goal2 = await service.getForDate(user2.id, workspace2.id, weekStart, 1);

      expect(goal1?.targetHours).toBe(20);
      expect(goal2?.targetHours).toBe(40);
    });

    it('should allow same weekStart for different users', async () => {
      const { user: user1, workspace: workspace1 } = await createTestUserWithWorkspace({ email: 'user1@test.com' });
      const { user: user2, workspace: workspace2 } = await createTestUserWithWorkspace({ email: 'user2@test.com' });
      const weekStart = new Date(Date.UTC(2024, 11, 16));

      const goal1 = await service.getOrCreateForWeek(user1.id, workspace1.id, weekStart);
      const goal2 = await service.getOrCreateForWeek(user2.id, workspace2.id, weekStart);

      expect(goal1.id).not.toBe(goal2.id);
      expect(goal1.userId).toBe(user1.id);
      expect(goal2.userId).toBe(user2.id);
    });
  });

  describe('Workspace isolation', () => {
    it('should not return goals from other workspaces', async () => {
      const prisma = jestPrisma.client;
      const { user, workspace: workspace1 } = await createTestUserWithWorkspace();
      const workspace2 = await createTestWorkspace(user.id, { name: 'Work' });
      const weekStart = new Date(Date.UTC(2024, 11, 16));

      await prisma.weeklyGoal.create({
        data: { userId: user.id, workspaceId: workspace1.id, weekStart, targetHours: 20, isCustom: false },
      });

      await prisma.weeklyGoal.create({
        data: { userId: user.id, workspaceId: workspace2.id, weekStart, targetHours: 40, isCustom: true },
      });

      const goal1 = await service.getForDate(user.id, workspace1.id, weekStart, 1);
      const goal2 = await service.getForDate(user.id, workspace2.id, weekStart, 1);

      expect(goal1?.targetHours).toBe(20);
      expect(goal2?.targetHours).toBe(40);
    });
  });
});
