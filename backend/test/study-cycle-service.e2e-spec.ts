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
import { SubscriptionService } from '../src/subscription/subscription.service';
import { createTestUser, createTestWorkspace, createTestUserWithWorkspace } from './helpers/database.helper';

describe('StudyCycleService', () => {
  let service: StudyCycleService;

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
        StudyCycleService,
        { provide: PrismaService, useValue: prisma },
        { provide: SubscriptionService, useValue: mockSubscriptionService },
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
          isActive: true,
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

    it('should auto-activate first cycle in workspace', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      const cycle = await service.create(user.id, workspace.id, {
        name: 'First Cycle',
        items: [{ subject: 'Math', targetMinutes: 60 }],
      });

      expect(cycle.isActive).toBe(true);
    });

    it('should not auto-activate second cycle unless specified', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      // Create first cycle (auto-activated)
      await service.create(user.id, workspace.id, {
        name: 'First Cycle',
        items: [{ subject: 'Math', targetMinutes: 60 }],
      });

      // Create second cycle (should not be active by default)
      const secondCycle = await service.create(user.id, workspace.id, {
        name: 'Second Cycle',
        items: [{ subject: 'Physics', targetMinutes: 60 }],
      });

      expect(secondCycle.isActive).toBe(false);
    });

    it('should activate second cycle when activateOnCreate is true', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      // Create first cycle
      const firstCycle = await service.create(user.id, workspace.id, {
        name: 'First Cycle',
        items: [{ subject: 'Math', targetMinutes: 60 }],
      });

      expect(firstCycle.isActive).toBe(true);

      // Create second cycle with activateOnCreate
      const secondCycle = await service.create(user.id, workspace.id, {
        name: 'Second Cycle',
        items: [{ subject: 'Physics', targetMinutes: 60 }],
        activateOnCreate: true,
      });

      expect(secondCycle.isActive).toBe(true);

      // First cycle should now be inactive
      const prisma = jestPrisma.client;
      const updatedFirst = await prisma.studyCycle.findUnique({
        where: { id: firstCycle.id },
      });
      expect(updatedFirst!.isActive).toBe(false);
    });

    it('should throw BadRequestException when creating cycle with duplicate name', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      await service.create(user.id, workspace.id, {
        name: 'My Cycle',
        items: [{ subject: 'Math', targetMinutes: 60 }],
      });

      await expect(
        service.create(user.id, workspace.id, {
          name: 'My Cycle',
          items: [{ subject: 'Physics', targetMinutes: 60 }],
        }),
      ).rejects.toThrow(BadRequestException);
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
          isActive: true,
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
          name: 'Test Cycle',
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
          name: 'Test Cycle',
          isActive: true,
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
          name: 'Test Cycle',
          isActive: true,
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
          name: 'Test Cycle',
          isActive: true,
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
          name: 'Test Cycle',
          isActive: true,
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
          name: 'Test Cycle',
          isActive: true,
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
          name: 'Test Cycle',
          isActive: true,
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
          name: 'Test Cycle',
          isActive: true,
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
          name: 'Test Cycle',
          isActive: true,
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
          name: 'Test Cycle',
          isActive: true,
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
          name: 'Test Cycle',
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
          name: 'Test Cycle',
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
          name: 'Test Cycle',
          isActive: true,
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
          name: 'Test Cycle',
          isActive: true,
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
          name: 'Test Cycle',
          isActive: true,
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
          name: 'Test Cycle',
          isActive: true,
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
          name: 'Test Cycle',
          isActive: true,
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
          name: 'Test Cycle',
          isActive: true,
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

    it('should return allItemsProgress with progress for all items', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
          name: 'Test Cycle',
          isActive: true,
          currentItemIndex: 0,
          items: {
            create: [
              { subject: 'Math', targetMinutes: 120, position: 0 },
              { subject: 'Physics', targetMinutes: 60, position: 1 },
              { subject: 'English', targetMinutes: 90, position: 2 },
            ],
          },
        },
      });

      // Add sessions for Math and Physics
      await prisma.studySession.createMany({
        data: [
          { userId: user.id, workspaceId: workspace.id, date: new Date(), subject: 'Math', minutes: 60 },
          { userId: user.id, workspaceId: workspace.id, date: new Date(), subject: 'Physics', minutes: 60 },
        ],
      });

      const suggestion = await service.getSuggestion(user.id, workspace.id);

      expect(suggestion.suggestion!.allItemsProgress).toHaveLength(3);

      const mathProgress = suggestion.suggestion!.allItemsProgress.find(p => p.subject === 'Math');
      expect(mathProgress!.accumulatedMinutes).toBe(60);
      expect(mathProgress!.targetMinutes).toBe(120);
      expect(mathProgress!.isComplete).toBe(false);

      const physicsProgress = suggestion.suggestion!.allItemsProgress.find(p => p.subject === 'Physics');
      expect(physicsProgress!.accumulatedMinutes).toBe(60);
      expect(physicsProgress!.targetMinutes).toBe(60);
      expect(physicsProgress!.isComplete).toBe(true);

      const englishProgress = suggestion.suggestion!.allItemsProgress.find(p => p.subject === 'English');
      expect(englishProgress!.accumulatedMinutes).toBe(0);
      expect(englishProgress!.isComplete).toBe(false);
    });
  });

  describe('listCycles', () => {
    it('should return empty array when no cycles exist', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      const cycles = await service.listCycles(user.id, workspace.id);

      expect(cycles).toHaveLength(0);
    });

    it('should return all cycles for workspace', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      await service.create(user.id, workspace.id, {
        name: 'Cycle 1',
        items: [{ subject: 'Math', targetMinutes: 60 }],
      });

      await service.create(user.id, workspace.id, {
        name: 'Cycle 2',
        items: [{ subject: 'Physics', targetMinutes: 60 }],
      });

      const cycles = await service.listCycles(user.id, workspace.id);

      expect(cycles).toHaveLength(2);
    });

    it('should return cycles sorted by active first, then display order', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      await service.create(user.id, workspace.id, {
        name: 'Cycle A',
        items: [{ subject: 'Math', targetMinutes: 60 }],
      });

      await service.create(user.id, workspace.id, {
        name: 'Cycle B',
        items: [{ subject: 'Physics', targetMinutes: 60 }],
        activateOnCreate: true,
      });

      const cycles = await service.listCycles(user.id, workspace.id);

      expect(cycles[0].name).toBe('Cycle B'); // Active one first
      expect(cycles[0].isActive).toBe(true);
      expect(cycles[1].name).toBe('Cycle A');
      expect(cycles[1].isActive).toBe(false);
    });

    it('should throw ForbiddenException when listing another user workspace cycles', async () => {
      const { workspace } = await createTestUserWithWorkspace({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      await expect(
        service.listCycles(user2.id, workspace.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('activateCycle', () => {
    it('should activate specified cycle and deactivate others', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      const cycle1 = await service.create(user.id, workspace.id, {
        name: 'Cycle 1',
        items: [{ subject: 'Math', targetMinutes: 60 }],
      });

      const cycle2 = await service.create(user.id, workspace.id, {
        name: 'Cycle 2',
        items: [{ subject: 'Physics', targetMinutes: 60 }],
      });

      expect(cycle1.isActive).toBe(true);
      expect(cycle2.isActive).toBe(false);

      // Activate cycle 2
      const activated = await service.activateCycle(user.id, workspace.id, cycle2.id);

      expect(activated.isActive).toBe(true);
      expect(activated.name).toBe('Cycle 2');

      // Verify cycle 1 is now inactive
      const prisma = jestPrisma.client;
      const updatedCycle1 = await prisma.studyCycle.findUnique({
        where: { id: cycle1.id },
      });
      expect(updatedCycle1!.isActive).toBe(false);
    });

    it('should throw NotFoundException when cycle does not exist', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      await expect(
        service.activateCycle(user.id, workspace.id, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when cycle belongs to different workspace', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const otherWorkspace = await createTestWorkspace(user.id, { name: 'Other' });

      const cycleInOther = await service.create(user.id, otherWorkspace.id, {
        name: 'Other Cycle',
        items: [{ subject: 'Math', targetMinutes: 60 }],
      });

      await expect(
        service.activateCycle(user.id, workspace.id, cycleInOther.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when activating another user cycle', async () => {
      const { user: user1, workspace } = await createTestUserWithWorkspace({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      const cycle = await service.create(user1.id, workspace.id, {
        name: 'User1 Cycle',
        items: [{ subject: 'Math', targetMinutes: 60 }],
      });

      await expect(
        service.activateCycle(user2.id, workspace.id, cycle.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getStatistics', () => {
    it('should return null when no active cycle exists', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      const stats = await service.getStatistics(user.id, workspace.id);

      expect(stats).toBeNull();
    });

    it('should return statistics for active cycle', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
          name: 'Test Cycle',
          isActive: true,
          items: {
            create: [
              { subject: 'Math', targetMinutes: 120, position: 0 },
              { subject: 'Physics', targetMinutes: 60, position: 1 },
              { subject: 'English', targetMinutes: 60, position: 2 },
            ],
          },
        },
      });

      // Add sessions
      await prisma.studySession.createMany({
        data: [
          { userId: user.id, workspaceId: workspace.id, date: new Date(), subject: 'Math', minutes: 60 },
          { userId: user.id, workspaceId: workspace.id, date: new Date(), subject: 'Physics', minutes: 60 },
        ],
      });

      const stats = await service.getStatistics(user.id, workspace.id);

      expect(stats).toBeDefined();
      expect(stats!.totalTargetMinutes).toBe(240); // 120 + 60 + 60
      expect(stats!.totalAccumulatedMinutes).toBe(120); // 60 + 60
      expect(stats!.completedItemsCount).toBe(1); // Physics is complete
      expect(stats!.totalItemsCount).toBe(3);
      expect(stats!.overallPercentage).toBe(50); // 120/240 * 100
      expect(stats!.averagePerItem).toBe(40); // 120/3
    });

    it('should cap overallPercentage at 100', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
          name: 'Test Cycle',
          isActive: true,
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
          minutes: 120, // More than target
        },
      });

      const stats = await service.getStatistics(user.id, workspace.id);

      expect(stats!.overallPercentage).toBe(100);
    });

    it('should throw ForbiddenException when accessing another user workspace', async () => {
      const { workspace } = await createTestUserWithWorkspace({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      await expect(
        service.getStatistics(user2.id, workspace.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getHistory', () => {
    it('should return null when no active cycle exists', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      const history = await service.getHistory(user.id, workspace.id);

      expect(history).toBeNull();
    });

    it('should return empty entries when no advances recorded', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      await service.create(user.id, workspace.id, {
        name: 'Test Cycle',
        items: [{ subject: 'Math', targetMinutes: 60 }],
      });

      const history = await service.getHistory(user.id, workspace.id);

      expect(history).toBeDefined();
      expect(history!.entries).toHaveLength(0);
      expect(history!.totalAdvances).toBe(0);
      expect(history!.totalCompletions).toBe(0);
    });

    it('should throw ForbiddenException when accessing another user workspace', async () => {
      const { workspace } = await createTestUserWithWorkspace({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      await expect(
        service.getHistory(user2.id, workspace.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('advanceToNext with history', () => {
    it('should record advance in history', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
          name: 'Test Cycle',
          isActive: true,
          currentItemIndex: 0,
          items: {
            create: [
              { subject: 'Math', targetMinutes: 60, position: 0 },
              { subject: 'Physics', targetMinutes: 60, position: 1 },
            ],
          },
        },
      });

      // Add session for Math
      await prisma.studySession.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          date: new Date(),
          subject: 'Math',
          minutes: 45,
        },
      });

      await service.advanceToNext(user.id, workspace.id);

      const history = await service.getHistory(user.id, workspace.id);

      expect(history!.entries).toHaveLength(1);
      expect(history!.totalAdvances).toBe(1);
      expect(history!.entries[0].type).toBe('advance');
      expect(history!.entries[0].fromSubject).toBe('Math');
      expect(history!.entries[0].toSubject).toBe('Physics');
      expect(history!.entries[0].minutesSpent).toBe(45);
    });

    it('should record cycle completion when wrapping to start', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
          name: 'Test Cycle',
          isActive: true,
          currentItemIndex: 1, // At last item
          items: {
            create: [
              { subject: 'Math', targetMinutes: 60, position: 0 },
              { subject: 'Physics', targetMinutes: 60, position: 1 },
            ],
          },
        },
      });

      await service.advanceToNext(user.id, workspace.id);

      const history = await service.getHistory(user.id, workspace.id);

      expect(history!.totalCompletions).toBe(1);

      const completion = history!.entries.find(e => e.type === 'completion');
      expect(completion).toBeDefined();
      expect(completion!.itemsCount).toBe(2);
      expect(completion!.totalTargetMinutes).toBe(120);
    });

    it('should limit history entries', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const cycle = await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
          name: 'Test Cycle',
          isActive: true,
          currentItemIndex: 0,
          items: {
            create: [
              { subject: 'Math', targetMinutes: 60, position: 0 },
              { subject: 'Physics', targetMinutes: 60, position: 1 },
            ],
          },
        },
      });

      // Create multiple advances
      for (let i = 0; i < 5; i++) {
        await prisma.studyCycleAdvance.create({
          data: {
            cycleId: cycle.id,
            fromSubject: 'Math',
            toSubject: 'Physics',
            fromPosition: 0,
            toPosition: 1,
            minutesSpent: 30,
          },
        });
      }

      const history = await service.getHistory(user.id, workspace.id, 3);

      expect(history!.entries).toHaveLength(3);
      expect(history!.totalAdvances).toBe(5);
    });
  });

  describe('resetCycle', () => {
    it('should reset cycle and set lastResetAt', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      const cycle = await service.create(user.id, workspace.id, {
        name: 'Test Cycle',
        items: [
          { subject: 'Math', targetMinutes: 60 },
          { subject: 'Physics', targetMinutes: 60 },
        ],
      });

      // Advance to position 1
      await service.advanceToNext(user.id, workspace.id);

      const updatedCycle = await service.resetCycle(user.id, workspace.id);

      expect(updatedCycle.currentItemIndex).toBe(0);
      expect(updatedCycle.lastResetAt).toBeDefined();
    });

    it('should throw NotFoundException when no active cycle', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      await expect(
        service.resetCycle(user.id, workspace.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('should filter sessions by lastResetAt in getSuggestion', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      // Create cycle
      await service.create(user.id, workspace.id, {
        name: 'Test Cycle',
        items: [{ subject: 'Math', targetMinutes: 120 }],
      });

      // Add session BEFORE reset (with createdAt in the past)
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 2); // 2 hours ago
      await prisma.studySession.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          date: new Date(),
          subject: 'Math',
          minutes: 60,
          createdAt: pastDate,
        },
      });

      // Check suggestion counts the session
      let suggestion = await service.getSuggestion(user.id, workspace.id);
      expect(suggestion.suggestion!.currentAccumulatedMinutes).toBe(60);

      // Reset the cycle
      await service.resetCycle(user.id, workspace.id);

      // Session created before reset should NOT count anymore
      suggestion = await service.getSuggestion(user.id, workspace.id);
      expect(suggestion.suggestion!.currentAccumulatedMinutes).toBe(0);

      // Add session AFTER reset
      await prisma.studySession.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          date: new Date(),
          subject: 'Math',
          minutes: 30,
        },
      });

      // Only post-reset session should count
      suggestion = await service.getSuggestion(user.id, workspace.id);
      expect(suggestion.suggestion!.currentAccumulatedMinutes).toBe(30);
    });

    it('should count sessions created after reset', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      // Create cycle
      await service.create(user.id, workspace.id, {
        name: 'Test Cycle',
        items: [{ subject: 'Math', targetMinutes: 120 }],
      });

      // Reset the cycle first
      await service.resetCycle(user.id, workspace.id);

      // Add session after reset (createdAt will be after lastResetAt)
      await prisma.studySession.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          date: new Date(),
          subject: 'Math',
          minutes: 45,
        },
      });

      // Session created after reset should count
      const suggestion = await service.getSuggestion(user.id, workspace.id);
      expect(suggestion.suggestion!.currentAccumulatedMinutes).toBe(45);
    });

    it('should throw ForbiddenException when resetting another user cycle', async () => {
      const { user: user1, workspace } = await createTestUserWithWorkspace({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      await service.create(user1.id, workspace.id, {
        name: 'User1 Cycle',
        items: [{ subject: 'Math', targetMinutes: 60 }],
      });

      await expect(
        service.resetCycle(user2.id, workspace.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('isCycleComplete', () => {
    it('should return isCycleComplete=true when all items are complete', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
          name: 'Test Cycle',
          isActive: true,
          currentItemIndex: 0,
          items: {
            create: [
              { subject: 'Math', targetMinutes: 60, position: 0 },
              { subject: 'Physics', targetMinutes: 60, position: 1 },
            ],
          },
        },
      });

      // Complete both subjects
      await prisma.studySession.createMany({
        data: [
          { userId: user.id, workspaceId: workspace.id, date: new Date(), subject: 'Math', minutes: 60 },
          { userId: user.id, workspaceId: workspace.id, date: new Date(), subject: 'Physics', minutes: 60 },
        ],
      });

      const suggestion = await service.getSuggestion(user.id, workspace.id);

      expect(suggestion.suggestion!.isCycleComplete).toBe(true);
    });

    it('should return isCycleComplete=false when some items are incomplete', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
          name: 'Test Cycle',
          isActive: true,
          currentItemIndex: 0,
          items: {
            create: [
              { subject: 'Math', targetMinutes: 60, position: 0 },
              { subject: 'Physics', targetMinutes: 60, position: 1 },
            ],
          },
        },
      });

      // Complete only Math
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

      expect(suggestion.suggestion!.isCycleComplete).toBe(false);
    });
  });

  describe('getCycle returns active cycle only', () => {
    it('should return only the active cycle', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      const cycle1 = await service.create(user.id, workspace.id, {
        name: 'Cycle 1',
        items: [{ subject: 'Math', targetMinutes: 60 }],
      });

      await service.create(user.id, workspace.id, {
        name: 'Cycle 2',
        items: [{ subject: 'Physics', targetMinutes: 60 }],
      });

      const activeCycle = await service.getCycle(user.id, workspace.id);

      expect(activeCycle).toBeDefined();
      expect(activeCycle!.id).toBe(cycle1.id);
      expect(activeCycle!.name).toBe('Cycle 1');
    });

    it('should return null when no active cycle', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      // Create inactive cycle directly
      await prisma.studyCycle.create({
        data: {
          workspaceId: workspace.id,
          name: 'Inactive Cycle',
          isActive: false,
          items: {
            create: [{ subject: 'Math', targetMinutes: 60, position: 0 }],
          },
        },
      });

      const activeCycle = await service.getCycle(user.id, workspace.id);

      expect(activeCycle).toBeNull();
    });
  });
});
