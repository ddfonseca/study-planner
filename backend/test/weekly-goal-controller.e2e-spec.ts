/**
 * WeeklyGoalController Tests
 * TDD: Tests written BEFORE implementation
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { WeeklyGoalController } from '../src/weekly-goal/weekly-goal.controller';
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

describe('WeeklyGoalController', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let service: WeeklyGoalService;

  beforeAll(async () => {
    prisma = new MockPrismaService();
    await prisma.$connect();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WeeklyGoalController],
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
              minHours: 20,
              desHours: 30,
              weekStartDay: 1,
            }),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    service = module.get<WeeklyGoalService>(WeeklyGoalService);
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('GET /api/weekly-goals/:weekStart', () => {
    it('should return goal for specific week', async () => {
      const user = await createTestUser();
      await createUserConfig(user.id);

      // Create goal for week
      const weekStart = new Date(Date.UTC(2024, 11, 16));
      await prisma.weeklyGoal.create({
        data: {
          userId: user.id,
          weekStart,
          minHours: 25,
          desHours: 35,
          isCustom: true,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/api/weekly-goals/2024-12-16')
        .set('x-user-id', user.id)
        .expect(200);

      expect(response.body.minHours).toBe(25);
      expect(response.body.desHours).toBe(35);
      expect(response.body.isCustom).toBe(true);
    });

    it('should create default goal if not exists', async () => {
      const user = await createTestUser();
      await createUserConfig(user.id, { minHours: 20, desHours: 30 });

      const response = await request(app.getHttpServer())
        .get('/api/weekly-goals/2024-12-16')
        .set('x-user-id', user.id)
        .expect(200);

      expect(response.body.minHours).toBe(20);
      expect(response.body.desHours).toBe(30);
      expect(response.body.isCustom).toBe(false);
    });
  });

  describe('PUT /api/weekly-goals/:weekStart', () => {
    it('should update current week goal', async () => {
      const user = await createTestUser();

      // Get current week start
      const now = new Date();
      const currentWeekStart = service.calculateWeekStart(now, 1);
      const weekStartStr = currentWeekStart.toISOString().split('T')[0];

      // Create goal for current week
      await prisma.weeklyGoal.create({
        data: {
          userId: user.id,
          weekStart: currentWeekStart,
          minHours: 20,
          desHours: 30,
          isCustom: false,
        },
      });

      const response = await request(app.getHttpServer())
        .put(`/api/weekly-goals/${weekStartStr}`)
        .set('x-user-id', user.id)
        .send({ minHours: 25, desHours: 40 })
        .expect(200);

      expect(response.body.minHours).toBe(25);
      expect(response.body.desHours).toBe(40);
      expect(response.body.isCustom).toBe(true);
    });

    it('should return 403 for past week', async () => {
      const user = await createTestUser();

      // Past week
      const pastWeekStart = new Date(Date.UTC(2024, 0, 1));

      await prisma.weeklyGoal.create({
        data: {
          userId: user.id,
          weekStart: pastWeekStart,
          minHours: 20,
          desHours: 30,
          isCustom: false,
        },
      });

      await request(app.getHttpServer())
        .put('/api/weekly-goals/2024-01-01')
        .set('x-user-id', user.id)
        .send({ minHours: 25, desHours: 40 })
        .expect(403);
    });
  });

  describe('GET /api/weekly-goals', () => {
    it('should return goals for date range', async () => {
      const user = await createTestUser();

      // Create multiple goals
      await prisma.weeklyGoal.createMany({
        data: [
          {
            userId: user.id,
            weekStart: new Date(Date.UTC(2024, 11, 2)),
            minHours: 20,
            desHours: 30,
            isCustom: false,
          },
          {
            userId: user.id,
            weekStart: new Date(Date.UTC(2024, 11, 9)),
            minHours: 25,
            desHours: 35,
            isCustom: true,
          },
          {
            userId: user.id,
            weekStart: new Date(Date.UTC(2024, 11, 16)),
            minHours: 20,
            desHours: 30,
            isCustom: false,
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/api/weekly-goals')
        .query({ startDate: '2024-12-05', endDate: '2024-12-20' })
        .set('x-user-id', user.id)
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });
  });
});
