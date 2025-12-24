/**
 * WorkspaceService Tests
 * Using jest-prisma for automatic transaction rollback
 */
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { WorkspaceService } from '../src/workspace/workspace.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { SubscriptionService } from '../src/subscription/subscription.service';
import { createTestUser, createTestWorkspace, createTestUserWithWorkspace } from './helpers/database.helper';

describe('WorkspaceService', () => {
  let service: WorkspaceService;

  // Mock SubscriptionService to always allow (no limits enforced in tests)
  const mockSubscriptionService = {
    enforceFeatureLimit: jest.fn().mockResolvedValue(undefined),
    checkFeatureLimit: jest.fn().mockResolvedValue({ allowed: true, limit: -1, current: 0, remaining: Infinity }),
  };

  beforeEach(async () => {
    const prisma = jestPrisma.client;
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceService,
        { provide: PrismaService, useValue: prisma },
        { provide: SubscriptionService, useValue: mockSubscriptionService },
      ],
    }).compile();

    service = module.get<WorkspaceService>(WorkspaceService);
  });

  describe('findAll', () => {
    it('should return all workspaces for a user', async () => {
      const user = await createTestUser();
      await createTestWorkspace(user.id, { name: 'Geral', isDefault: true });
      await createTestWorkspace(user.id, { name: 'Work' });
      await createTestWorkspace(user.id, { name: 'Personal' });

      const workspaces = await service.findAll(user.id);

      expect(workspaces).toHaveLength(3);
    });

    it('should order by isDefault desc, then name asc', async () => {
      const user = await createTestUser();
      await createTestWorkspace(user.id, { name: 'Zzz', isDefault: false });
      await createTestWorkspace(user.id, { name: 'Aaa', isDefault: false });
      await createTestWorkspace(user.id, { name: 'Default', isDefault: true });

      const workspaces = await service.findAll(user.id);

      expect(workspaces[0].name).toBe('Default');
      expect(workspaces[1].name).toBe('Aaa');
      expect(workspaces[2].name).toBe('Zzz');
    });

    it('should return empty array when no workspaces', async () => {
      const user = await createTestUser();

      const workspaces = await service.findAll(user.id);

      expect(workspaces).toHaveLength(0);
    });

    it('should not return workspaces from other users', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });
      await createTestWorkspace(user1.id, { name: 'User1 Workspace' });
      await createTestWorkspace(user2.id, { name: 'User2 Workspace' });

      const user1Workspaces = await service.findAll(user1.id);
      const user2Workspaces = await service.findAll(user2.id);

      expect(user1Workspaces).toHaveLength(1);
      expect(user1Workspaces[0].name).toBe('User1 Workspace');
      expect(user2Workspaces).toHaveLength(1);
      expect(user2Workspaces[0].name).toBe('User2 Workspace');
    });
  });

  describe('findById', () => {
    it('should return workspace by id', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id, { name: 'Test' });

      const found = await service.findById(user.id, workspace.id);

      expect(found).toBeDefined();
      expect(found.id).toBe(workspace.id);
      expect(found.name).toBe('Test');
    });

    it('should throw NotFoundException when workspace does not exist', async () => {
      const user = await createTestUser();

      await expect(
        service.findById(user.id, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when accessing another user workspace', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });
      const workspace = await createTestWorkspace(user1.id, { name: 'Test' });

      await expect(
        service.findById(user2.id, workspace.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    it('should create a workspace', async () => {
      const user = await createTestUser();

      const workspace = await service.create(user.id, {
        name: 'Work',
        color: '#ff0000',
      });

      expect(workspace).toBeDefined();
      expect(workspace.userId).toBe(user.id);
      expect(workspace.name).toBe('Work');
      expect(workspace.color).toBe('#ff0000');
      expect(workspace.isDefault).toBe(false);
    });

    it('should create workspace with default color from database when not specified', async () => {
      const user = await createTestUser();

      const workspace = await service.create(user.id, { name: 'Work' });

      // Database has default color #6366f1
      expect(workspace.color).toBe('#6366f1');
    });

    it('should throw BadRequestException when name already exists', async () => {
      const user = await createTestUser();
      await createTestWorkspace(user.id, { name: 'Work' });

      await expect(
        service.create(user.id, { name: 'Work' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow same name for different users', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });
      await createTestWorkspace(user1.id, { name: 'Work' });

      const workspace = await service.create(user2.id, { name: 'Work' });

      expect(workspace.name).toBe('Work');
    });

    it('should throw ForbiddenException when subscription limit exceeded', async () => {
      const user = await createTestUser();

      // Mock subscription service to throw on limit check
      mockSubscriptionService.enforceFeatureLimit.mockRejectedValueOnce(
        new ForbiddenException('Limite de workspaces atingido. Faça upgrade para criar mais.'),
      );

      await expect(
        service.create(user.id, { name: 'New Workspace' }),
      ).rejects.toThrow(ForbiddenException);

      // Verify enforceFeatureLimit was called
      expect(mockSubscriptionService.enforceFeatureLimit).toHaveBeenCalledWith(
        user.id,
        'max_workspaces',
        expect.any(Number),
        expect.any(String),
      );
    });
  });

  describe('update', () => {
    it('should update workspace name', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id, { name: 'Old Name' });

      const updated = await service.update(user.id, workspace.id, {
        name: 'New Name',
      });

      expect(updated.name).toBe('New Name');
    });

    it('should update workspace color', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id, {
        name: 'Test',
        color: '#000000',
      });

      const updated = await service.update(user.id, workspace.id, {
        color: '#ffffff',
      });

      expect(updated.color).toBe('#ffffff');
    });

    it('should throw BadRequestException when new name already exists', async () => {
      const user = await createTestUser();
      await createTestWorkspace(user.id, { name: 'Existing' });
      const workspace = await createTestWorkspace(user.id, { name: 'ToRename' });

      await expect(
        service.update(user.id, workspace.id, { name: 'Existing' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow keeping the same name', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id, { name: 'Same' });

      const updated = await service.update(user.id, workspace.id, {
        name: 'Same',
        color: '#ff0000',
      });

      expect(updated.name).toBe('Same');
      expect(updated.color).toBe('#ff0000');
    });

    it('should throw NotFoundException when workspace does not exist', async () => {
      const user = await createTestUser();

      await expect(
        service.update(user.id, 'non-existent-id', { name: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when updating another user workspace', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });
      const workspace = await createTestWorkspace(user1.id, { name: 'Test' });

      await expect(
        service.update(user2.id, workspace.id, { name: 'Hacked' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete workspace', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id, { name: 'ToDelete' });

      const result = await service.delete(user.id, workspace.id);

      expect(result.success).toBe(true);

      const workspaces = await service.findAll(user.id);
      expect(workspaces).toHaveLength(0);
    });

    it('should throw BadRequestException when deleting default workspace', async () => {
      const user = await createTestUser();
      const workspace = await createTestWorkspace(user.id, {
        name: 'Geral',
        isDefault: true,
      });

      await expect(
        service.delete(user.id, workspace.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('should move sessions to default workspace when moveToDefault=true', async () => {
      const { user, workspace: defaultWorkspace } = await createTestUserWithWorkspace();
      const workToDelete = await createTestWorkspace(user.id, { name: 'Work' });

      // Create session in workspace to be deleted
      const prisma = jestPrisma.client;
      await prisma.studySession.create({
        data: {
          userId: user.id,
          workspaceId: workToDelete.id,
          date: new Date('2024-12-16'),
          subject: 'Math',
          minutes: 60,
        },
      });

      await service.delete(user.id, workToDelete.id, true);

      // Verify session was moved to default workspace
      const sessions = await prisma.studySession.findMany({
        where: { userId: user.id },
      });
      expect(sessions).toHaveLength(1);
      expect(sessions[0].workspaceId).toBe(defaultWorkspace.id);
    });

    it('should delete sessions when moveToDefault=false (cascade)', async () => {
      const { user } = await createTestUserWithWorkspace();
      const workToDelete = await createTestWorkspace(user.id, { name: 'Work' });

      const prisma = jestPrisma.client;
      await prisma.studySession.create({
        data: {
          userId: user.id,
          workspaceId: workToDelete.id,
          date: new Date('2024-12-16'),
          subject: 'Math',
          minutes: 60,
        },
      });

      await service.delete(user.id, workToDelete.id, false);

      const sessions = await prisma.studySession.findMany({
        where: { userId: user.id, workspaceId: workToDelete.id },
      });
      expect(sessions).toHaveLength(0);
    });

    it('should throw NotFoundException when workspace does not exist', async () => {
      const user = await createTestUser();

      await expect(
        service.delete(user.id, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when deleting another user workspace', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });
      const workspace = await createTestWorkspace(user1.id, { name: 'Test' });

      await expect(
        service.delete(user2.id, workspace.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createDefaultForUser', () => {
    it('should create default workspace for new user', async () => {
      const user = await createTestUser();

      const workspace = await service.createDefaultForUser(user.id);

      expect(workspace).toBeDefined();
      expect(workspace.userId).toBe(user.id);
      expect(workspace.name).toBe('Geral');
      expect(workspace.isDefault).toBe(true);
    });

    it('should return existing default workspace if already exists', async () => {
      const user = await createTestUser();
      const existing = await createTestWorkspace(user.id, {
        name: 'Geral',
        isDefault: true,
      });

      const workspace = await service.createDefaultForUser(user.id);

      expect(workspace.id).toBe(existing.id);
    });
  });

  describe('getDefaultWorkspace', () => {
    it('should return default workspace', async () => {
      const { user, workspace: defaultWorkspace } = await createTestUserWithWorkspace();

      const workspace = await service.getDefaultWorkspace(user.id);

      expect(workspace.id).toBe(defaultWorkspace.id);
      expect(workspace.isDefault).toBe(true);
    });

    it('should create default workspace if not exists', async () => {
      const user = await createTestUser();

      const workspace = await service.getDefaultWorkspace(user.id);

      expect(workspace).toBeDefined();
      expect(workspace.name).toBe('Geral');
      expect(workspace.isDefault).toBe(true);
    });
  });

  describe('getDistinctSubjects', () => {
    it('should return distinct subjects from workspace', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.studySession.createMany({
        data: [
          { userId: user.id, workspaceId: workspace.id, date: new Date(), subject: 'Math', minutes: 60 },
          { userId: user.id, workspaceId: workspace.id, date: new Date(), subject: 'Physics', minutes: 45 },
          { userId: user.id, workspaceId: workspace.id, date: new Date(), subject: 'Math', minutes: 30 },
        ],
      });

      const subjects = await service.getDistinctSubjects(user.id, workspace.id);

      expect(subjects).toHaveLength(2);
      expect(subjects).toEqual(['Math', 'Physics']);
    });

    it('should return empty array when no sessions', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      const subjects = await service.getDistinctSubjects(user.id, workspace.id);

      expect(subjects).toHaveLength(0);
    });

    it('should throw ForbiddenException when accessing another user workspace', async () => {
      const { workspace } = await createTestUserWithWorkspace({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      await expect(
        service.getDistinctSubjects(user2.id, workspace.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getStats', () => {
    it('should return workspace stats', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.studySession.createMany({
        data: [
          { userId: user.id, workspaceId: workspace.id, date: new Date(), subject: 'Math', minutes: 60 },
          { userId: user.id, workspaceId: workspace.id, date: new Date(), subject: 'Physics', minutes: 45 },
        ],
      });

      const stats = await service.getStats(user.id, workspace.id);

      expect(stats.sessionsCount).toBe(2);
      expect(stats.totalMinutes).toBe(105);
    });

    it('should return zero stats when no sessions', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      const stats = await service.getStats(user.id, workspace.id);

      expect(stats.sessionsCount).toBe(0);
      expect(stats.totalMinutes).toBe(0);
    });

    it('should throw ForbiddenException when accessing another user workspace', async () => {
      const { workspace } = await createTestUserWithWorkspace({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      await expect(
        service.getStats(user2.id, workspace.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
