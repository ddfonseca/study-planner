/**
 * StudySessionsService Tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { StudySessionsService } from '../src/study-sessions/study-sessions.service';
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

describe('StudySessionsService', () => {
  let service: StudySessionsService;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new MockPrismaService();
    await prisma.$connect();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudySessionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<StudySessionsService>(StudySessionsService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('create', () => {
    it('should create a study session', async () => {
      const user = await createTestUser();

      const session = await service.create(user.id, {
        date: '2024-12-16',
        subject: 'Math',
        minutes: 60,
      });

      expect(session).toBeDefined();
      expect(session.userId).toBe(user.id);
      expect(session.subject).toBe('Math');
      expect(session.minutes).toBe(60);
    });

    it('should create multiple sessions for same user', async () => {
      const user = await createTestUser();

      await service.create(user.id, { date: '2024-12-16', subject: 'Math', minutes: 60 });
      await service.create(user.id, { date: '2024-12-16', subject: 'Physics', minutes: 45 });
      await service.create(user.id, { date: '2024-12-17', subject: 'Math', minutes: 30 });

      const sessions = await service.findByDateRange(user.id);
      expect(sessions).toHaveLength(3);
    });
  });

  describe('findByDateRange', () => {
    it('should return all sessions when no date range specified', async () => {
      const user = await createTestUser();

      await service.create(user.id, { date: '2024-12-10', subject: 'Math', minutes: 60 });
      await service.create(user.id, { date: '2024-12-20', subject: 'Physics', minutes: 45 });

      const sessions = await service.findByDateRange(user.id);
      expect(sessions).toHaveLength(2);
    });

    it('should filter by start date', async () => {
      const user = await createTestUser();

      await service.create(user.id, { date: '2024-12-10', subject: 'Math', minutes: 60 });
      await service.create(user.id, { date: '2024-12-20', subject: 'Physics', minutes: 45 });

      const sessions = await service.findByDateRange(user.id, '2024-12-15');
      expect(sessions).toHaveLength(1);
      expect(sessions[0].subject).toBe('Physics');
    });

    it('should filter by end date', async () => {
      const user = await createTestUser();

      await service.create(user.id, { date: '2024-12-10', subject: 'Math', minutes: 60 });
      await service.create(user.id, { date: '2024-12-20', subject: 'Physics', minutes: 45 });

      const sessions = await service.findByDateRange(user.id, undefined, '2024-12-15');
      expect(sessions).toHaveLength(1);
      expect(sessions[0].subject).toBe('Math');
    });

    it('should filter by date range', async () => {
      const user = await createTestUser();

      await service.create(user.id, { date: '2024-12-10', subject: 'Math', minutes: 60 });
      await service.create(user.id, { date: '2024-12-15', subject: 'Chemistry', minutes: 30 });
      await service.create(user.id, { date: '2024-12-20', subject: 'Physics', minutes: 45 });

      const sessions = await service.findByDateRange(user.id, '2024-12-12', '2024-12-18');
      expect(sessions).toHaveLength(1);
      expect(sessions[0].subject).toBe('Chemistry');
    });

    it('should return empty array when no sessions in range', async () => {
      const user = await createTestUser();

      await service.create(user.id, { date: '2024-12-10', subject: 'Math', minutes: 60 });

      const sessions = await service.findByDateRange(user.id, '2024-12-20', '2024-12-25');
      expect(sessions).toHaveLength(0);
    });

    it('should order sessions by date ascending', async () => {
      const user = await createTestUser();

      await service.create(user.id, { date: '2024-12-20', subject: 'Physics', minutes: 45 });
      await service.create(user.id, { date: '2024-12-10', subject: 'Math', minutes: 60 });
      await service.create(user.id, { date: '2024-12-15', subject: 'Chemistry', minutes: 30 });

      const sessions = await service.findByDateRange(user.id);
      expect(sessions[0].subject).toBe('Math');
      expect(sessions[1].subject).toBe('Chemistry');
      expect(sessions[2].subject).toBe('Physics');
    });
  });

  describe('update', () => {
    it('should update session minutes', async () => {
      const user = await createTestUser();
      const session = await service.create(user.id, {
        date: '2024-12-16',
        subject: 'Math',
        minutes: 60,
      });

      const updated = await service.update(user.id, session.id, { minutes: 90 });

      expect(updated.minutes).toBe(90);
      expect(updated.subject).toBe('Math'); // unchanged
    });

    it('should update session subject', async () => {
      const user = await createTestUser();
      const session = await service.create(user.id, {
        date: '2024-12-16',
        subject: 'Math',
        minutes: 60,
      });

      const updated = await service.update(user.id, session.id, { subject: 'Algebra' });

      expect(updated.subject).toBe('Algebra');
      expect(updated.minutes).toBe(60); // unchanged
    });

    it('should throw NotFoundException when session does not exist', async () => {
      const user = await createTestUser();

      await expect(
        service.update(user.id, 'non-existent-id', { minutes: 90 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when updating another user session', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      const session = await service.create(user1.id, {
        date: '2024-12-16',
        subject: 'Math',
        minutes: 60,
      });

      await expect(
        service.update(user2.id, session.id, { minutes: 90 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete session', async () => {
      const user = await createTestUser();
      const session = await service.create(user.id, {
        date: '2024-12-16',
        subject: 'Math',
        minutes: 60,
      });

      const result = await service.delete(user.id, session.id);

      expect(result.success).toBe(true);

      const sessions = await service.findByDateRange(user.id);
      expect(sessions).toHaveLength(0);
    });

    it('should throw NotFoundException when session does not exist', async () => {
      const user = await createTestUser();

      await expect(
        service.delete(user.id, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when deleting another user session', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      const session = await service.create(user1.id, {
        date: '2024-12-16',
        subject: 'Math',
        minutes: 60,
      });

      await expect(
        service.delete(user2.id, session.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getDistinctSubjects', () => {
    it('should return unique subjects in alphabetical order', async () => {
      const user = await createTestUser();

      await service.create(user.id, { date: '2024-12-10', subject: 'Physics', minutes: 60 });
      await service.create(user.id, { date: '2024-12-11', subject: 'Math', minutes: 45 });
      await service.create(user.id, { date: '2024-12-12', subject: 'Physics', minutes: 30 });
      await service.create(user.id, { date: '2024-12-13', subject: 'Chemistry', minutes: 60 });
      await service.create(user.id, { date: '2024-12-14', subject: 'Math', minutes: 45 });

      const subjects = await service.getDistinctSubjects(user.id);

      expect(subjects).toHaveLength(3);
      expect(subjects).toEqual(['Chemistry', 'Math', 'Physics']);
    });

    it('should return empty array when no sessions', async () => {
      const user = await createTestUser();

      const subjects = await service.getDistinctSubjects(user.id);

      expect(subjects).toHaveLength(0);
    });
  });

  describe('User isolation', () => {
    it('should not return sessions from other users', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      await service.create(user1.id, { date: '2024-12-16', subject: 'Math', minutes: 60 });
      await service.create(user2.id, { date: '2024-12-16', subject: 'Physics', minutes: 45 });

      const user1Sessions = await service.findByDateRange(user1.id);
      const user2Sessions = await service.findByDateRange(user2.id);

      expect(user1Sessions).toHaveLength(1);
      expect(user1Sessions[0].subject).toBe('Math');

      expect(user2Sessions).toHaveLength(1);
      expect(user2Sessions[0].subject).toBe('Physics');
    });

    it('should not return subjects from other users', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      await service.create(user1.id, { date: '2024-12-16', subject: 'Math', minutes: 60 });
      await service.create(user2.id, { date: '2024-12-16', subject: 'Physics', minutes: 45 });

      const user1Subjects = await service.getDistinctSubjects(user1.id);
      const user2Subjects = await service.getDistinctSubjects(user2.id);

      expect(user1Subjects).toEqual(['Math']);
      expect(user2Subjects).toEqual(['Physics']);
    });
  });
});
