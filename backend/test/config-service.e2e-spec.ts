/**
 * ConfigService Tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '../src/config/config.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanDatabase, createTestUser } from './helpers/database.helper';

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

describe('ConfigService', () => {
  let service: ConfigService;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new MockPrismaService();
    await prisma.$connect();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('findByUserId', () => {
    it('should create default config if not exists', async () => {
      const user = await createTestUser();

      const config = await service.findByUserId(user.id);

      expect(config).toBeDefined();
      expect(config.userId).toBe(user.id);
      expect(config.targetHours).toBe(30); // default
      expect(config.weekStartDay).toBe(1); // Monday default
    });

    it('should return existing config', async () => {
      const user = await createTestUser();

      // Create config directly
      await prisma.userConfig.create({
        data: {
          userId: user.id,
          targetHours: 25,
          weekStartDay: 0, // Sunday
        },
      });

      const config = await service.findByUserId(user.id);

      expect(config.targetHours).toBe(25);
      expect(config.weekStartDay).toBe(0);
    });

    it('should return same config on multiple calls', async () => {
      const user = await createTestUser();

      const config1 = await service.findByUserId(user.id);
      const config2 = await service.findByUserId(user.id);

      expect(config1.id).toBe(config2.id);
      expect(config1.targetHours).toBe(config2.targetHours);
    });
  });

  describe('update', () => {
    it('should update targetHours', async () => {
      const user = await createTestUser();

      // Create initial config
      await service.findByUserId(user.id);

      const updated = await service.update(user.id, { targetHours: 40 });

      expect(updated.targetHours).toBe(40);
    });

    it('should create config if not exists when updating', async () => {
      const user = await createTestUser();

      // No config exists yet
      const updated = await service.update(user.id, { targetHours: 35 });

      expect(updated).toBeDefined();
      expect(updated.targetHours).toBe(35);
    });

    it('should preserve other fields when updating one field', async () => {
      const user = await createTestUser();

      // Create config with custom weekStartDay
      await prisma.userConfig.create({
        data: {
          userId: user.id,
          targetHours: 25,
          weekStartDay: 0,
        },
      });

      const updated = await service.update(user.id, { targetHours: 40 });

      expect(updated.targetHours).toBe(40);
      expect(updated.weekStartDay).toBe(0); // preserved
    });
  });

  describe('User isolation', () => {
    it('should not share config between users', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      // Create different configs
      await service.update(user1.id, { targetHours: 20 });
      await service.update(user2.id, { targetHours: 40 });

      const config1 = await service.findByUserId(user1.id);
      const config2 = await service.findByUserId(user2.id);

      expect(config1.targetHours).toBe(20);
      expect(config2.targetHours).toBe(40);
    });
  });
});
