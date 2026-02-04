/**
 * SubjectService Tests
 * Using jest-prisma for automatic transaction rollback
 */
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { SubjectService } from '../src/subject/subject.service';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  createTestUser,
  createTestWorkspace,
  createTestUserWithWorkspace,
} from './helpers/database.helper';

describe('SubjectService', () => {
  let service: SubjectService;

  beforeEach(async () => {
    const prisma = jestPrisma.client;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubjectService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SubjectService>(SubjectService);
  });

  describe('findAll', () => {
    it('should return empty array when no subjects exist', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      const subjects = await service.findAll(user.id, workspace.id);

      expect(subjects).toHaveLength(0);
    });

    it('should return all subjects ordered by position', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.subject.createMany({
        data: [
          { workspaceId: workspace.id, name: 'Math', position: 1 },
          { workspaceId: workspace.id, name: 'English', position: 0 },
          { workspaceId: workspace.id, name: 'Physics', position: 2 },
        ],
      });

      const subjects = await service.findAll(user.id, workspace.id);

      expect(subjects).toHaveLength(3);
      expect(subjects[0].name).toBe('English');
      expect(subjects[1].name).toBe('Math');
      expect(subjects[2].name).toBe('Physics');
    });

    it('should exclude archived subjects by default', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.subject.createMany({
        data: [
          { workspaceId: workspace.id, name: 'Active', position: 0 },
          {
            workspaceId: workspace.id,
            name: 'Archived',
            position: 1,
            archivedAt: new Date(),
          },
        ],
      });

      const subjects = await service.findAll(user.id, workspace.id);

      expect(subjects).toHaveLength(1);
      expect(subjects[0].name).toBe('Active');
    });

    it('should include archived subjects when requested', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.subject.createMany({
        data: [
          { workspaceId: workspace.id, name: 'Active', position: 0 },
          {
            workspaceId: workspace.id,
            name: 'Archived',
            position: 1,
            archivedAt: new Date(),
          },
        ],
      });

      const subjects = await service.findAll(user.id, workspace.id, true);

      expect(subjects).toHaveLength(2);
    });

    it('should throw ForbiddenException for another user workspace', async () => {
      const { workspace } = await createTestUserWithWorkspace({
        email: 'user1@test.com',
      });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      await expect(service.findAll(user2.id, workspace.id)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findOne', () => {
    it('should return subject with categories', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const category = await prisma.category.create({
        data: { workspaceId: workspace.id, name: 'Important' },
      });

      const subject = await prisma.subject.create({
        data: {
          workspaceId: workspace.id,
          name: 'Math',
          position: 0,
          categories: {
            create: { categoryId: category.id },
          },
        },
      });

      const result = await service.findOne(user.id, subject.id);

      expect(result.name).toBe('Math');
      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].category.name).toBe('Important');
    });

    it('should throw NotFoundException when subject does not exist', async () => {
      const { user } = await createTestUserWithWorkspace();

      await expect(service.findOne(user.id, 'non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException for another user subject', async () => {
      const { workspace } = await createTestUserWithWorkspace({
        email: 'user1@test.com',
      });
      const user2 = await createTestUser({ email: 'user2@test.com' });
      const prisma = jestPrisma.client;

      const subject = await prisma.subject.create({
        data: { workspaceId: workspace.id, name: 'Math', position: 0 },
      });

      await expect(service.findOne(user2.id, subject.id)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('create', () => {
    it('should create a subject', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      const subject = await service.create(user.id, workspace.id, {
        name: 'Math',
      });

      expect(subject.name).toBe('Math');
      expect(subject.workspaceId).toBe(workspace.id);
      expect(subject.position).toBe(0);
    });

    it('should create subject with color and icon', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      const subject = await service.create(user.id, workspace.id, {
        name: 'Math',
        color: '#ff0000',
        icon: 'calculator',
      });

      expect(subject.color).toBe('#ff0000');
      expect(subject.icon).toBe('calculator');
    });

    it('should auto-increment position', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      const first = await service.create(user.id, workspace.id, {
        name: 'First',
      });
      const second = await service.create(user.id, workspace.id, {
        name: 'Second',
      });
      const third = await service.create(user.id, workspace.id, {
        name: 'Third',
      });

      expect(first.position).toBe(0);
      expect(second.position).toBe(1);
      expect(third.position).toBe(2);
    });

    it('should create subject with categories', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const category = await prisma.category.create({
        data: { workspaceId: workspace.id, name: 'Priority' },
      });

      const subject = await service.create(user.id, workspace.id, {
        name: 'Math',
        categoryIds: [category.id],
      });

      expect(subject.categories).toHaveLength(1);
      expect(subject.categories[0].category.name).toBe('Priority');
    });

    it('should throw ConflictException for duplicate name', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      await service.create(user.id, workspace.id, { name: 'Math' });

      await expect(
        service.create(user.id, workspace.id, { name: 'Math' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException for another user workspace', async () => {
      const { workspace } = await createTestUserWithWorkspace({
        email: 'user1@test.com',
      });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      await expect(
        service.create(user2.id, workspace.id, { name: 'Math' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOrCreate', () => {
    it('should return existing subject', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const existing = await prisma.subject.create({
        data: { workspaceId: workspace.id, name: 'Math', position: 0 },
      });

      const subject = await service.findOrCreate(user.id, workspace.id, 'Math');

      expect(subject.id).toBe(existing.id);
    });

    it('should create new subject if not exists', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      const subject = await service.findOrCreate(user.id, workspace.id, 'Math');

      expect(subject.name).toBe('Math');
      expect(subject.position).toBe(0);
    });

    it('should unarchive existing archived subject', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.subject.create({
        data: {
          workspaceId: workspace.id,
          name: 'Math',
          position: 0,
          archivedAt: new Date(),
        },
      });

      const subject = await service.findOrCreate(user.id, workspace.id, 'Math');

      expect(subject.name).toBe('Math');
      expect(subject.archivedAt).toBeNull();
    });
  });

  describe('update', () => {
    it('should update subject name', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const subject = await prisma.subject.create({
        data: { workspaceId: workspace.id, name: 'Old Name', position: 0 },
      });

      const updated = await service.update(user.id, subject.id, {
        name: 'New Name',
      });

      expect(updated.name).toBe('New Name');
    });

    it('should update subject color and icon', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const subject = await prisma.subject.create({
        data: { workspaceId: workspace.id, name: 'Math', position: 0 },
      });

      const updated = await service.update(user.id, subject.id, {
        color: '#00ff00',
        icon: 'book',
      });

      expect(updated.color).toBe('#00ff00');
      expect(updated.icon).toBe('book');
    });

    it('should update category assignments', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const category1 = await prisma.category.create({
        data: { workspaceId: workspace.id, name: 'Cat1' },
      });
      const category2 = await prisma.category.create({
        data: { workspaceId: workspace.id, name: 'Cat2' },
      });

      const subject = await prisma.subject.create({
        data: {
          workspaceId: workspace.id,
          name: 'Math',
          position: 0,
          categories: {
            create: { categoryId: category1.id },
          },
        },
      });

      // Update to only have category2
      const updated = await service.update(user.id, subject.id, {
        categoryIds: [category2.id],
      });

      expect(updated.categories).toHaveLength(1);
      expect(updated.categories[0].category.name).toBe('Cat2');
    });

    it('should throw ConflictException for duplicate name', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.subject.create({
        data: { workspaceId: workspace.id, name: 'Math', position: 0 },
      });
      const subject2 = await prisma.subject.create({
        data: { workspaceId: workspace.id, name: 'Physics', position: 1 },
      });

      await expect(
        service.update(user.id, subject2.id, { name: 'Math' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('archive', () => {
    it('should archive subject', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const subject = await prisma.subject.create({
        data: { workspaceId: workspace.id, name: 'Math', position: 0 },
      });

      const archived = await service.archive(user.id, subject.id);

      expect(archived.archivedAt).not.toBeNull();
    });

    it('should throw NotFoundException when subject does not exist', async () => {
      const { user } = await createTestUserWithWorkspace();

      await expect(service.archive(user.id, 'non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('unarchive', () => {
    it('should unarchive subject', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const subject = await prisma.subject.create({
        data: {
          workspaceId: workspace.id,
          name: 'Math',
          position: 0,
          archivedAt: new Date(),
        },
      });

      const unarchived = await service.unarchive(user.id, subject.id);

      expect(unarchived.archivedAt).toBeNull();
    });
  });

  describe('permanentDelete', () => {
    it('should permanently delete archived subject', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const subject = await prisma.subject.create({
        data: {
          workspaceId: workspace.id,
          name: 'Math',
          position: 0,
          archivedAt: new Date(),
        },
      });

      const result = await service.permanentDelete(user.id, subject.id);

      expect(result.deleted).toBe(true);

      const deleted = await prisma.subject.findUnique({
        where: { id: subject.id },
      });
      expect(deleted).toBeNull();
    });

    it('should throw BadRequestException for non-archived subject', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const subject = await prisma.subject.create({
        data: { workspaceId: workspace.id, name: 'Math', position: 0 },
      });

      await expect(
        service.permanentDelete(user.id, subject.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when subject does not exist', async () => {
      const { user } = await createTestUserWithWorkspace();

      await expect(
        service.permanentDelete(user.id, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('merge', () => {
    it('should merge subjects into target', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const target = await prisma.subject.create({
        data: { workspaceId: workspace.id, name: 'Target', position: 0 },
      });
      const source = await prisma.subject.create({
        data: { workspaceId: workspace.id, name: 'Source', position: 1 },
      });

      // Create sessions for source
      await prisma.studySession.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          subjectId: source.id,
          subject: 'Source',
          date: new Date(),
          minutes: 60,
        },
      });

      const merged = await service.merge(user.id, {
        sourceIds: [source.id],
        targetId: target.id,
      });

      expect(merged?.id).toBe(target.id);

      // Source should be deleted
      const deletedSource = await prisma.subject.findUnique({
        where: { id: source.id },
      });
      expect(deletedSource).toBeNull();

      // Sessions should point to target
      const sessions = await prisma.studySession.findMany({
        where: { subjectId: target.id },
      });
      expect(sessions).toHaveLength(1);
    });

    it('should throw NotFoundException when subject not found', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const target = await prisma.subject.create({
        data: { workspaceId: workspace.id, name: 'Target', position: 0 },
      });

      await expect(
        service.merge(user.id, {
          sourceIds: ['non-existent'],
          targetId: target.id,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for different workspaces', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const workspace2 = await createTestWorkspace(user.id, { name: 'Other' });
      const prisma = jestPrisma.client;

      const target = await prisma.subject.create({
        data: { workspaceId: workspace.id, name: 'Target', position: 0 },
      });
      const source = await prisma.subject.create({
        data: { workspaceId: workspace2.id, name: 'Source', position: 0 },
      });

      await expect(
        service.merge(user.id, {
          sourceIds: [source.id],
          targetId: target.id,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for another user subjects', async () => {
      const { workspace } = await createTestUserWithWorkspace({
        email: 'user1@test.com',
      });
      const user2 = await createTestUser({ email: 'user2@test.com' });
      const prisma = jestPrisma.client;

      const target = await prisma.subject.create({
        data: { workspaceId: workspace.id, name: 'Target', position: 0 },
      });
      const source = await prisma.subject.create({
        data: { workspaceId: workspace.id, name: 'Source', position: 1 },
      });

      await expect(
        service.merge(user2.id, {
          sourceIds: [source.id],
          targetId: target.id,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('reorder', () => {
    it('should reorder subjects', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const s1 = await prisma.subject.create({
        data: { workspaceId: workspace.id, name: 'First', position: 0 },
      });
      const s2 = await prisma.subject.create({
        data: { workspaceId: workspace.id, name: 'Second', position: 1 },
      });
      const s3 = await prisma.subject.create({
        data: { workspaceId: workspace.id, name: 'Third', position: 2 },
      });

      // Reorder: Third, First, Second
      await service.reorder(user.id, workspace.id, {
        subjectIds: [s3.id, s1.id, s2.id],
      });

      const subjects = await service.findAll(user.id, workspace.id);

      expect(subjects[0].name).toBe('Third');
      expect(subjects[0].position).toBe(0);
      expect(subjects[1].name).toBe('First');
      expect(subjects[1].position).toBe(1);
      expect(subjects[2].name).toBe('Second');
      expect(subjects[2].position).toBe(2);
    });

    it('should throw ForbiddenException for another user workspace', async () => {
      const { workspace } = await createTestUserWithWorkspace({
        email: 'user1@test.com',
      });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      await expect(
        service.reorder(user2.id, workspace.id, { subjectIds: ['some-id'] }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
