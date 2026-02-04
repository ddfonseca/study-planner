/**
 * DisciplineService Tests
 * Using jest-prisma for automatic transaction rollback
 */
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { DisciplineService } from '../src/discipline/discipline.service';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  createTestUser,
  createTestWorkspace,
  createTestUserWithWorkspace,
} from './helpers/database.helper';

describe('DisciplineService', () => {
  let service: DisciplineService;

  beforeEach(async () => {
    const prisma = jestPrisma.client;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisciplineService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DisciplineService>(DisciplineService);
  });

  describe('findAll', () => {
    it('should return empty array when no disciplines exist', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      const disciplines = await service.findAll(user.id, workspace.id);

      expect(disciplines).toHaveLength(0);
    });

    it('should return all disciplines ordered by position', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.discipline.createMany({
        data: [
          { workspaceId: workspace.id, name: 'Math', position: 1 },
          { workspaceId: workspace.id, name: 'English', position: 0 },
          { workspaceId: workspace.id, name: 'Physics', position: 2 },
        ],
      });

      const disciplines = await service.findAll(user.id, workspace.id);

      expect(disciplines).toHaveLength(3);
      expect(disciplines[0].name).toBe('English');
      expect(disciplines[1].name).toBe('Math');
      expect(disciplines[2].name).toBe('Physics');
    });

    it('should include subjects in disciplines', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const discipline = await prisma.discipline.create({
        data: { workspaceId: workspace.id, name: 'Languages', position: 0 },
      });

      await prisma.subject.createMany({
        data: [
          {
            workspaceId: workspace.id,
            name: 'Grammar',
            position: 0,
            disciplineId: discipline.id,
          },
          {
            workspaceId: workspace.id,
            name: 'Vocabulary',
            position: 1,
            disciplineId: discipline.id,
          },
        ],
      });

      const disciplines = await service.findAll(user.id, workspace.id);

      expect(disciplines[0].subjects).toHaveLength(2);
      expect(disciplines[0].subjects[0].name).toBe('Grammar');
      expect(disciplines[0].subjects[1].name).toBe('Vocabulary');
    });

    it('should not include archived subjects', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const discipline = await prisma.discipline.create({
        data: { workspaceId: workspace.id, name: 'Languages', position: 0 },
      });

      await prisma.subject.createMany({
        data: [
          {
            workspaceId: workspace.id,
            name: 'Active',
            position: 0,
            disciplineId: discipline.id,
          },
          {
            workspaceId: workspace.id,
            name: 'Archived',
            position: 1,
            disciplineId: discipline.id,
            archivedAt: new Date(),
          },
        ],
      });

      const disciplines = await service.findAll(user.id, workspace.id);

      expect(disciplines[0].subjects).toHaveLength(1);
      expect(disciplines[0].subjects[0].name).toBe('Active');
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
    it('should return discipline with subjects', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const discipline = await prisma.discipline.create({
        data: { workspaceId: workspace.id, name: 'Math', position: 0 },
      });

      await prisma.subject.create({
        data: {
          workspaceId: workspace.id,
          name: 'Algebra',
          position: 0,
          disciplineId: discipline.id,
        },
      });

      const result = await service.findOne(user.id, discipline.id);

      expect(result.name).toBe('Math');
      expect(result.subjects).toHaveLength(1);
      expect(result.subjects[0].name).toBe('Algebra');
    });

    it('should throw NotFoundException when discipline does not exist', async () => {
      const { user } = await createTestUserWithWorkspace();

      await expect(service.findOne(user.id, 'non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException for another user discipline', async () => {
      const { workspace } = await createTestUserWithWorkspace({
        email: 'user1@test.com',
      });
      const user2 = await createTestUser({ email: 'user2@test.com' });
      const prisma = jestPrisma.client;

      const discipline = await prisma.discipline.create({
        data: { workspaceId: workspace.id, name: 'Math', position: 0 },
      });

      await expect(service.findOne(user2.id, discipline.id)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('create', () => {
    it('should create a discipline', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      const discipline = await service.create(user.id, workspace.id, {
        name: 'Math',
      });

      expect(discipline.name).toBe('Math');
      expect(discipline.workspaceId).toBe(workspace.id);
      expect(discipline.position).toBe(0);
    });

    it('should create discipline with color and icon', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();

      const discipline = await service.create(user.id, workspace.id, {
        name: 'Math',
        color: '#ff0000',
        icon: 'calculator',
      });

      expect(discipline.color).toBe('#ff0000');
      expect(discipline.icon).toBe('calculator');
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

    it('should create discipline with linked subjects', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const subject1 = await prisma.subject.create({
        data: { workspaceId: workspace.id, name: 'Algebra', position: 0 },
      });
      const subject2 = await prisma.subject.create({
        data: { workspaceId: workspace.id, name: 'Geometry', position: 1 },
      });

      const discipline = await service.create(user.id, workspace.id, {
        name: 'Math',
        subjectIds: [subject1.id, subject2.id],
      });

      expect(discipline.subjects).toHaveLength(2);
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

  describe('update', () => {
    it('should update discipline name', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const discipline = await prisma.discipline.create({
        data: { workspaceId: workspace.id, name: 'Old Name', position: 0 },
      });

      const updated = await service.update(user.id, discipline.id, {
        name: 'New Name',
      });

      expect(updated.name).toBe('New Name');
    });

    it('should update discipline color and icon', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const discipline = await prisma.discipline.create({
        data: { workspaceId: workspace.id, name: 'Math', position: 0 },
      });

      const updated = await service.update(user.id, discipline.id, {
        color: '#00ff00',
        icon: 'book',
      });

      expect(updated.color).toBe('#00ff00');
      expect(updated.icon).toBe('book');
    });

    it('should update subject assignments', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const discipline = await prisma.discipline.create({
        data: { workspaceId: workspace.id, name: 'Math', position: 0 },
      });

      const subject1 = await prisma.subject.create({
        data: {
          workspaceId: workspace.id,
          name: 'Algebra',
          position: 0,
          disciplineId: discipline.id,
        },
      });
      const subject2 = await prisma.subject.create({
        data: { workspaceId: workspace.id, name: 'Geometry', position: 1 },
      });

      // Update to only include subject2
      const updated = await service.update(user.id, discipline.id, {
        subjectIds: [subject2.id],
      });

      expect(updated.subjects).toHaveLength(1);
      expect(updated.subjects[0].id).toBe(subject2.id);

      // Verify subject1 is now unlinked
      const unlinkedSubject = await prisma.subject.findUnique({
        where: { id: subject1.id },
      });
      expect(unlinkedSubject?.disciplineId).toBeNull();
    });

    it('should throw ConflictException for duplicate name', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      await prisma.discipline.create({
        data: { workspaceId: workspace.id, name: 'Math', position: 0 },
      });
      const discipline2 = await prisma.discipline.create({
        data: { workspaceId: workspace.id, name: 'Physics', position: 1 },
      });

      await expect(
        service.update(user.id, discipline2.id, { name: 'Math' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow updating to same name', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const discipline = await prisma.discipline.create({
        data: { workspaceId: workspace.id, name: 'Math', position: 0 },
      });

      const updated = await service.update(user.id, discipline.id, {
        name: 'Math',
        color: '#ff0000',
      });

      expect(updated.name).toBe('Math');
      expect(updated.color).toBe('#ff0000');
    });
  });

  describe('addSubjects', () => {
    it('should add subjects to discipline', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const discipline = await prisma.discipline.create({
        data: { workspaceId: workspace.id, name: 'Math', position: 0 },
      });

      const subject = await prisma.subject.create({
        data: { workspaceId: workspace.id, name: 'Algebra', position: 0 },
      });

      const updated = await service.addSubjects(user.id, discipline.id, [
        subject.id,
      ]);

      expect(updated.subjects).toHaveLength(1);
      expect(updated.subjects[0].id).toBe(subject.id);
    });

    it('should add multiple subjects', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const discipline = await prisma.discipline.create({
        data: { workspaceId: workspace.id, name: 'Math', position: 0 },
      });

      const subject1 = await prisma.subject.create({
        data: { workspaceId: workspace.id, name: 'Algebra', position: 0 },
      });
      const subject2 = await prisma.subject.create({
        data: { workspaceId: workspace.id, name: 'Geometry', position: 1 },
      });

      const updated = await service.addSubjects(user.id, discipline.id, [
        subject1.id,
        subject2.id,
      ]);

      expect(updated.subjects).toHaveLength(2);
    });
  });

  describe('removeSubjects', () => {
    it('should remove subjects from discipline', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const discipline = await prisma.discipline.create({
        data: { workspaceId: workspace.id, name: 'Math', position: 0 },
      });

      const subject = await prisma.subject.create({
        data: {
          workspaceId: workspace.id,
          name: 'Algebra',
          position: 0,
          disciplineId: discipline.id,
        },
      });

      const updated = await service.removeSubjects(user.id, discipline.id, [
        subject.id,
      ]);

      expect(updated.subjects).toHaveLength(0);

      // Verify subject still exists but unlinked
      const unlinkedSubject = await prisma.subject.findUnique({
        where: { id: subject.id },
      });
      expect(unlinkedSubject).toBeDefined();
      expect(unlinkedSubject?.disciplineId).toBeNull();
    });

    it('should throw BadRequestException for empty subjectIds', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const discipline = await prisma.discipline.create({
        data: { workspaceId: workspace.id, name: 'Math', position: 0 },
      });

      await expect(
        service.removeSubjects(user.id, discipline.id, []),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should delete discipline', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const discipline = await prisma.discipline.create({
        data: { workspaceId: workspace.id, name: 'Math', position: 0 },
      });

      await service.delete(user.id, discipline.id);

      const deleted = await prisma.discipline.findUnique({
        where: { id: discipline.id },
      });
      expect(deleted).toBeNull();
    });

    it('should unlink subjects when discipline is deleted', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const discipline = await prisma.discipline.create({
        data: { workspaceId: workspace.id, name: 'Math', position: 0 },
      });

      const subject = await prisma.subject.create({
        data: {
          workspaceId: workspace.id,
          name: 'Algebra',
          position: 0,
          disciplineId: discipline.id,
        },
      });

      await service.delete(user.id, discipline.id);

      const unlinkedSubject = await prisma.subject.findUnique({
        where: { id: subject.id },
      });
      expect(unlinkedSubject).toBeDefined();
      expect(unlinkedSubject?.disciplineId).toBeNull();
    });

    it('should throw NotFoundException when discipline does not exist', async () => {
      const { user } = await createTestUserWithWorkspace();

      await expect(service.delete(user.id, 'non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException for another user discipline', async () => {
      const { workspace } = await createTestUserWithWorkspace({
        email: 'user1@test.com',
      });
      const user2 = await createTestUser({ email: 'user2@test.com' });
      const prisma = jestPrisma.client;

      const discipline = await prisma.discipline.create({
        data: { workspaceId: workspace.id, name: 'Math', position: 0 },
      });

      await expect(service.delete(user2.id, discipline.id)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('reorder', () => {
    it('should reorder disciplines', async () => {
      const { user, workspace } = await createTestUserWithWorkspace();
      const prisma = jestPrisma.client;

      const d1 = await prisma.discipline.create({
        data: { workspaceId: workspace.id, name: 'First', position: 0 },
      });
      const d2 = await prisma.discipline.create({
        data: { workspaceId: workspace.id, name: 'Second', position: 1 },
      });
      const d3 = await prisma.discipline.create({
        data: { workspaceId: workspace.id, name: 'Third', position: 2 },
      });

      // Reorder: Third, First, Second
      const reordered = await service.reorder(user.id, workspace.id, [
        d3.id,
        d1.id,
        d2.id,
      ]);

      expect(reordered[0].name).toBe('Third');
      expect(reordered[0].position).toBe(0);
      expect(reordered[1].name).toBe('First');
      expect(reordered[1].position).toBe(1);
      expect(reordered[2].name).toBe('Second');
      expect(reordered[2].position).toBe(2);
    });

    it('should throw ForbiddenException for another user workspace', async () => {
      const { workspace } = await createTestUserWithWorkspace({
        email: 'user1@test.com',
      });
      const user2 = await createTestUser({ email: 'user2@test.com' });

      await expect(
        service.reorder(user2.id, workspace.id, ['some-id']),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
