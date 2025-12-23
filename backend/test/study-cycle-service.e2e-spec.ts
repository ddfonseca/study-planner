/**
 * StudyCycleService Tests
 * Using jest-prisma for automatic transaction rollback
 */
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { StudyCycleService } from '../src/study-cycle/study-cycle.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestUser, createTestWorkspace, createTestUserWithWorkspace } from './helpers/database.helper';

describe('StudyCycleService', () => {
  let service: StudyCycleService;

  beforeEach(async () => {
    const prisma = jestPrisma.client;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudyCycleService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<StudyCycleService>(StudyCycleService);
  });

  describe('getCycle', () => {
    it('should return null when no cycle exists', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      const cycle = await service.getCycle(user.id, workspace.id);

      expect(cycle).toBeNull();
    });

    it('should return cycle with items ordered by position', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const createdCycle = await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
          name: 'Test Cycle',
          items: {
            create: [
              { subject: 'Math', targetMinutes: 120, position: 0 },
              { subject: 'Physics', targetMinutes: 60, position: 1 },
              { subject: 'English', targetMinutes: 30, position: 2 },
            ],
          },
        },
      });

      const cycle = await service.getCycle(user.id, workspace.id);

      expect(cycle).toBeDefined();
      expect(cycle!.id).toBe(createdCycle.id);
      expect(cycle!.name).toBe('Test Cycle');
      expect(cycle!.items).toHaveLength(3);
      expect(cycle!.items[0].subject).toBe('Math');
      expect(cycle!.items[1].subject).toBe('Physics');
      expect(cycle!.items[2].subject).toBe('English');
    });

    it('should throw ForbiddenException when accessing another user workspace', async () => {
      const { workspace } = await createTestUserWithWorkspace({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      await expect(
        service.getCycle(user2.id, workspace.id),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when workspace does not exist', async () => {
      const user = await createTestUser();

      await expect(
        service.getCycle(user.id, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new cycle with items', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      const cycle = await service.create(user.id, workspace.id, {
        name: 'Concurso TRT',
        items: [
          { subject: 'Português', targetMinutes: 120 },
          { subject: 'Matemática', targetMinutes: 90 },
          { subject: 'Direito', targetMinutes: 60 },
        ],
      });

      expect(cycle).toBeDefined();
      expect(cycle.workspaceId).toBe(workspace.id);
      expect(cycle.name).toBe('Concurso TRT');
      expect(cycle.isActive).toBe(true);
      expect(cycle.currentItemIndex).toBe(0);
      expect(cycle.items).toHaveLength(3);
      expect(cycle.items[0].subject).toBe('Português');
      expect(cycle.items[0].position).toBe(0);
      expect(cycle.items[1].subject).toBe('Matemática');
      expect(cycle.items[1].position).toBe(1);
    });

    it('should create cycle without name', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      const cycle = await service.create(user.id, workspace.id, {
        items: [{ subject: 'Math', targetMinutes: 60 }],
      });

      expect(cycle.name).toBeNull();
    });

    it('should replace existing cycle', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      // Create initial cycle
      await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
          name: 'Old Cycle',
          items: {
            create: [{ subject: 'Old Subject', targetMinutes: 30, position: 0 }],
          },
        },
      });

      // Create new cycle (should replace)
      const newCycle = await service.create(user.id, workspace.id, {
        name: 'New Cycle',
        items: [{ subject: 'New Subject', targetMinutes: 60 }],
      });

      expect(newCycle.name).toBe('New Cycle');
      expect(newCycle.items[0].subject).toBe('New Subject');

      // Verify only one cycle exists
      const cycles = await prisma.studyCycle.findMany({
        where: { workspaceId: workspace.id },
      });
      expect(cycles).toHaveLength(1);
    });

    it('should throw ForbiddenException when creating in another user workspace', async () => {
      const { workspace } = await createTestUserWithWorkspace({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      await expect(
        service.create(user2.id, workspace.id, {
          items: [{ subject: 'Math', targetMinutes: 60 }],
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update cycle name', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
          name: 'Old Name',
          items: {
            create: [{ subject: 'Math', targetMinutes: 60, position: 0 }],
          },
        },
      });

      const updated = await service.update(user.id, workspace.id, {
        name: 'New Name',
      });

      expect(updated.name).toBe('New Name');
    });

    it('should update isActive status', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
          isActive: true,
          items: {
            create: [{ subject: 'Math', targetMinutes: 60, position: 0 }],
          },
        },
      });

      const updated = await service.update(user.id, workspace.id, {
        isActive: false,
      });

      expect(updated.isActive).toBe(false);
    });

    it('should update currentItemIndex', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
          currentItemIndex: 0,
          items: {
            create: [
              { subject: 'Math', targetMinutes: 60, position: 0 },
              { subject: 'Physics', targetMinutes: 60, position: 1 },
            ],
          },
        },
      });

      const updated = await service.update(user.id, workspace.id, {
        currentItemIndex: 1,
      });

      expect(updated.currentItemIndex).toBe(1);
    });

    it('should replace items when items array is provided', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
          items: {
            create: [
              { subject: 'Old1', targetMinutes: 30, position: 0 },
              { subject: 'Old2', targetMinutes: 30, position: 1 },
            ],
          },
        },
      });

      const updated = await service.update(user.id, workspace.id, {
        items: [
          { subject: 'New1', targetMinutes: 60 },
          { subject: 'New2', targetMinutes: 90 },
          { subject: 'New3', targetMinutes: 120 },
        ],
      });

      expect(updated.items).toHaveLength(3);
      expect(updated.items[0].subject).toBe('New1');
      expect(updated.items[1].subject).toBe('New2');
      expect(updated.items[2].subject).toBe('New3');
    });

    it('should adjust currentItemIndex when items are reduced', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
          currentItemIndex: 2,
          items: {
            create: [
              { subject: 'A', targetMinutes: 30, position: 0 },
              { subject: 'B', targetMinutes: 30, position: 1 },
              { subject: 'C', targetMinutes: 30, position: 2 },
            ],
          },
        },
      });

      const updated = await service.update(user.id, workspace.id, {
        items: [{ subject: 'Only', targetMinutes: 60 }],
      });

      // currentItemIndex should be adjusted to last valid index (0)
      expect(updated.currentItemIndex).toBe(0);
    });

    it('should throw NotFoundException when cycle does not exist', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      await expect(
        service.update(user.id, workspace.id, { name: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when updating another user cycle', async () => {
      const { workspace } = await createTestUserWithWorkspace({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });
      const prisma = jestPrisma.client;

      await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
          items: {
            create: [{ subject: 'Math', targetMinutes: 60, position: 0 }],
          },
        },
      });

      await expect(
        service.update(user2.id, workspace.id, { name: 'Hacked' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete cycle', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
          items: {
            create: [{ subject: 'Math', targetMinutes: 60, position: 0 }],
          },
        },
      });

      const result = await service.delete(user.id, workspace.id);

      expect(result.success).toBe(true);

      const cycle = await service.getCycle(user.id, workspace.id);
      expect(cycle).toBeNull();
    });

    it('should delete items when cycle is deleted (cascade)', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
          items: {
            create: [
              { subject: 'Math', targetMinutes: 60, position: 0 },
              { subject: 'Physics', targetMinutes: 60, position: 1 },
            ],
          },
        },
      });

      await service.delete(user.id, workspace.id);

      const items = await prisma.studyCycleItem.findMany({
        where: { cycle: { workspaceId: workspace.id } },
      });
      expect(items).toHaveLength(0);
    });

    it('should not throw when deleting non-existent cycle', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      const result = await service.delete(user.id, workspace.id);

      expect(result.success).toBe(true);
    });

    it('should throw ForbiddenException when deleting another user cycle', async () => {
      const { workspace } = await createTestUserWithWorkspace({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      await expect(
        service.delete(user2.id, workspace.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('advanceToNext', () => {
    it('should advance to next item', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
          currentItemIndex: 0,
          items: {
            create: [
              { subject: 'Math', targetMinutes: 60, position: 0 },
              { subject: 'Physics', targetMinutes: 60, position: 1 },
              { subject: 'English', targetMinutes: 60, position: 2 },
            ],
          },
        },
      });

      const updated = await service.advanceToNext(user.id, workspace.id);

      expect(updated.currentItemIndex).toBe(1);
    });

    it('should wrap around to first item when at end', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
          currentItemIndex: 2,
          items: {
            create: [
              { subject: 'Math', targetMinutes: 60, position: 0 },
              { subject: 'Physics', targetMinutes: 60, position: 1 },
              { subject: 'English', targetMinutes: 60, position: 2 },
            ],
          },
        },
      });

      const updated = await service.advanceToNext(user.id, workspace.id);

      expect(updated.currentItemIndex).toBe(0);
    });

    it('should throw NotFoundException when cycle does not exist', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      await expect(
        service.advanceToNext(user.id, workspace.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when cycle has no items', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
        },
      });

      await expect(
        service.advanceToNext(user.id, workspace.id),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSuggestion', () => {
    it('should return hasCycle=false when no cycle exists', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      const suggestion = await service.getSuggestion(user.id, workspace.id);

      expect(suggestion.hasCycle).toBe(false);
      expect(suggestion.suggestion).toBeNull();
    });

    it('should return hasCycle=false when cycle is inactive', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
          isActive: false,
          items: {
            create: [{ subject: 'Math', targetMinutes: 60, position: 0 }],
          },
        },
      });

      const suggestion = await service.getSuggestion(user.id, workspace.id);

      expect(suggestion.hasCycle).toBe(false);
    });

    it('should return hasCycle=false when cycle has no items', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
          isActive: true,
        },
      });

      const suggestion = await service.getSuggestion(user.id, workspace.id);

      expect(suggestion.hasCycle).toBe(false);
    });

    it('should return current subject suggestion', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
          currentItemIndex: 0,
          items: {
            create: [
              { subject: 'Matemática', targetMinutes: 120, position: 0 },
              { subject: 'Português', targetMinutes: 60, position: 1 },
            ],
          },
        },
      });

      const suggestion = await service.getSuggestion(user.id, workspace.id);

      expect(suggestion.hasCycle).toBe(true);
      expect(suggestion.suggestion).toBeDefined();
      expect(suggestion.suggestion!.currentSubject).toBe('Matemática');
      expect(suggestion.suggestion!.currentTargetMinutes).toBe(120);
      expect(suggestion.suggestion!.currentAccumulatedMinutes).toBe(0);
      expect(suggestion.suggestion!.remainingMinutes).toBe(120);
      expect(suggestion.suggestion!.isCurrentComplete).toBe(false);
      expect(suggestion.suggestion!.nextSubject).toBe('Português');
      expect(suggestion.suggestion!.currentPosition).toBe(0);
      expect(suggestion.suggestion!.totalItems).toBe(2);
    });

    it('should calculate accumulated minutes from sessions', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
          currentItemIndex: 0,
          items: {
            create: [
              { subject: 'Math', targetMinutes: 120, position: 0 },
              { subject: 'Physics', targetMinutes: 60, position: 1 },
            ],
          },
        },
      });

      // Add study sessions for Math
      await prisma.studySession.createMany({
        data: [
          { userId: user.id, workspaceId: workspace.id, date: new Date(), subject: 'Math', minutes: 30 },
          { userId: user.id, workspaceId: workspace.id, date: new Date(), subject: 'Math', minutes: 45 },
        ],
      });

      const suggestion = await service.getSuggestion(user.id, workspace.id);

      expect(suggestion.suggestion!.currentAccumulatedMinutes).toBe(75);
      expect(suggestion.suggestion!.remainingMinutes).toBe(45);
      expect(suggestion.suggestion!.isCurrentComplete).toBe(false);
    });

    it('should mark as complete when target is reached', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
          currentItemIndex: 0,
          items: {
            create: [
              { subject: 'Math', targetMinutes: 60, position: 0 },
              { subject: 'Physics', targetMinutes: 60, position: 1 },
            ],
          },
        },
      });

      await prisma.studySession.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          date: new Date(),
          subject: 'Math',
          minutes: 60,
        },
      });

      const suggestion = await service.getSuggestion(user.id, workspace.id);

      expect(suggestion.suggestion!.isCurrentComplete).toBe(true);
      expect(suggestion.suggestion!.remainingMinutes).toBe(0);
    });

    it('should mark as complete when target is exceeded', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
          currentItemIndex: 0,
          items: {
            create: [{ subject: 'Math', targetMinutes: 60, position: 0 }],
          },
        },
      });

      await prisma.studySession.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          date: new Date(),
          subject: 'Math',
          minutes: 90,
        },
      });

      const suggestion = await service.getSuggestion(user.id, workspace.id);

      expect(suggestion.suggestion!.isCurrentComplete).toBe(true);
      expect(suggestion.suggestion!.remainingMinutes).toBe(0);
    });

    it('should wrap next subject to first when at last item', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
          currentItemIndex: 1,
          items: {
            create: [
              { subject: 'Math', targetMinutes: 60, position: 0 },
              { subject: 'Physics', targetMinutes: 60, position: 1 },
            ],
          },
        },
      });

      const suggestion = await service.getSuggestion(user.id, workspace.id);

      expect(suggestion.suggestion!.currentSubject).toBe('Physics');
      expect(suggestion.suggestion!.nextSubject).toBe('Math');
    });

    it('should only count sessions from the same workspace', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const otherWorkspace = await createTestWorkspace(user.id, { name: 'Other' });
      const prisma = jestPrisma.client;

      await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
          currentItemIndex: 0,
          items: {
            create: [{ subject: 'Math', targetMinutes: 120, position: 0 }],
          },
        },
      });

      // Session in current workspace
      await prisma.studySession.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          date: new Date(),
          subject: 'Math',
          minutes: 30,
        },
      });

      // Session in other workspace (should not count)
      await prisma.studySession.create({
        data: {
          userId: user.id,
          workspaceId: otherWorkspace.id,
          date: new Date(),
          subject: 'Math',
          minutes: 100,
        },
      });

      const suggestion = await service.getSuggestion(user.id, workspace.id);

      expect(suggestion.suggestion!.currentAccumulatedMinutes).toBe(30);
    });

    it('should throw ForbiddenException when accessing another user workspace', async () => {
      const { workspace } = await createTestUserWithWorkspace({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      await expect(
        service.getSuggestion(user2.id, workspace.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
