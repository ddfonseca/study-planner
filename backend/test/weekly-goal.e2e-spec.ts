/**
 * WeeklyGoal E2E Tests
 * TDD: Tests written BEFORE implementation
 */
import { PrismaClient } from '@prisma/client';
import {
  cleanDatabase,
  createTestUser,
  createUserConfig,
} from './helpers/database.helper';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://test:test@localhost:5433/study_planner_test?schema=public',
    },
  },
});

describe('WeeklyGoal Model', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Creation', () => {
    it('should create weekly goal with default values', async () => {
      const user = await createTestUser();

      const weeklyGoal = await prisma.weeklyGoal.create({
        data: {
          userId: user.id,
          weekStart: new Date('2024-12-16'), // Monday
          targetHours: 30,
          isCustom: false,
        },
      });

      expect(weeklyGoal).toBeDefined();
      expect(weeklyGoal.userId).toBe(user.id);
      expect(weeklyGoal.targetHours).toBe(30);
      expect(weeklyGoal.isCustom).toBe(false);
    });

    it('should not allow duplicate weekStart for same user', async () => {
      const user = await createTestUser();
      const weekStart = new Date('2024-12-16');

      await prisma.weeklyGoal.create({
        data: {
          userId: user.id,
          weekStart,
          targetHours: 30,
          isCustom: false,
        },
      });

      // Attempt to create duplicate
      await expect(
        prisma.weeklyGoal.create({
          data: {
            userId: user.id,
            weekStart,
            targetHours: 35,
            isCustom: true,
          },
        }),
      ).rejects.toThrow();
    });

    it('should allow same weekStart for different users', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });
      const weekStart = new Date('2024-12-16');

      const goal1 = await prisma.weeklyGoal.create({
        data: {
          userId: user1.id,
          weekStart,
          targetHours: 30,
          isCustom: false,
        },
      });

      const goal2 = await prisma.weeklyGoal.create({
        data: {
          userId: user2.id,
          weekStart,
          targetHours: 25,
          isCustom: false,
        },
      });

      expect(goal1.id).not.toBe(goal2.id);
      expect(goal1.userId).toBe(user1.id);
      expect(goal2.userId).toBe(user2.id);
    });
  });

  describe('Queries', () => {
    it('should find weekly goal by userId and weekStart', async () => {
      const user = await createTestUser();
      const weekStart = new Date('2024-12-16');

      await prisma.weeklyGoal.create({
        data: {
          userId: user.id,
          weekStart,
          targetHours: 30,
          isCustom: false,
        },
      });

      const found = await prisma.weeklyGoal.findUnique({
        where: {
          userId_weekStart: {
            userId: user.id,
            weekStart,
          },
        },
      });

      expect(found).toBeDefined();
      expect(found?.targetHours).toBe(30);
    });

    it('should find all weekly goals for a user', async () => {
      const user = await createTestUser();

      await prisma.weeklyGoal.createMany({
        data: [
          {
            userId: user.id,
            weekStart: new Date('2024-12-09'),
            targetHours: 30,
            isCustom: false,
          },
          {
            userId: user.id,
            weekStart: new Date('2024-12-16'),
            targetHours: 35,
            isCustom: true,
          },
          {
            userId: user.id,
            weekStart: new Date('2024-12-23'),
            targetHours: 30,
            isCustom: false,
          },
        ],
      });

      const goals = await prisma.weeklyGoal.findMany({
        where: { userId: user.id },
        orderBy: { weekStart: 'asc' },
      });

      expect(goals).toHaveLength(3);
      expect(goals[1].isCustom).toBe(true);
    });
  });

  describe('Cascade Delete', () => {
    it('should delete weekly goals when user is deleted', async () => {
      const user = await createTestUser();

      await prisma.weeklyGoal.create({
        data: {
          userId: user.id,
          weekStart: new Date('2024-12-16'),
          targetHours: 30,
          isCustom: false,
        },
      });

      // Delete user
      await prisma.user.delete({ where: { id: user.id } });

      // Weekly goals should be deleted too
      const goals = await prisma.weeklyGoal.findMany({
        where: { userId: user.id },
      });

      expect(goals).toHaveLength(0);
    });
  });
});
