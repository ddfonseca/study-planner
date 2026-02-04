import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSubjectDto,
  UpdateSubjectDto,
  MergeSubjectsDto,
  ReorderSubjectsDto,
} from './dto';

@Injectable()
export class SubjectService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lista todos os subjects de um workspace
   */
  async findAll(
    userId: string,
    workspaceId: string,
    includeArchived = false,
  ) {
    // Verify workspace belongs to user
    await this.verifyWorkspaceAccess(userId, workspaceId);

    return this.prisma.subject.findMany({
      where: {
        workspaceId,
        ...(includeArchived ? {} : { archivedAt: null }),
      },
      orderBy: { position: 'asc' },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });
  }

  /**
   * Busca um subject por ID
   */
  async findOne(userId: string, subjectId: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        workspace: true,
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    if (subject.workspace.userId !== userId) {
      throw new ForbiddenException('Not authorized to access this subject');
    }

    return subject;
  }

  /**
   * Cria um novo subject
   */
  async create(userId: string, workspaceId: string, dto: CreateSubjectDto) {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    // Check for duplicate name in workspace
    const existing = await this.prisma.subject.findUnique({
      where: {
        workspaceId_name: { workspaceId, name: dto.name },
      },
    });

    if (existing) {
      throw new ConflictException('Subject with this name already exists');
    }

    // Get max position if not provided
    let position = dto.position;
    if (position === undefined) {
      const maxPosition = await this.prisma.subject.aggregate({
        where: { workspaceId },
        _max: { position: true },
      });
      position = (maxPosition._max.position ?? -1) + 1;
    }

    // Create subject with optional category connections
    return this.prisma.subject.create({
      data: {
        workspaceId,
        name: dto.name,
        color: dto.color,
        icon: dto.icon,
        position,
        disciplineId: dto.disciplineId,
        ...(dto.categoryIds?.length && {
          categories: {
            create: dto.categoryIds.map((categoryId) => ({
              categoryId,
            })),
          },
        }),
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });
  }

  /**
   * Cria um subject se não existir, ou retorna o existente
   * Usado para manter a UX de criar inline
   */
  async findOrCreate(userId: string, workspaceId: string, name: string) {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    // Check if already exists
    const existing = await this.prisma.subject.findUnique({
      where: {
        workspaceId_name: { workspaceId, name },
      },
    });

    if (existing) {
      // If archived, unarchive it
      if (existing.archivedAt) {
        return this.prisma.subject.update({
          where: { id: existing.id },
          data: { archivedAt: null },
        });
      }
      return existing;
    }

    // Create new subject
    const maxPosition = await this.prisma.subject.aggregate({
      where: { workspaceId },
      _max: { position: true },
    });

    return this.prisma.subject.create({
      data: {
        workspaceId,
        name,
        position: (maxPosition._max.position ?? -1) + 1,
      },
    });
  }

  /**
   * Atualiza um subject
   */
  async update(userId: string, subjectId: string, dto: UpdateSubjectDto) {
    const subject = await this.findOne(userId, subjectId);

    // If changing name, check for duplicates
    if (dto.name && dto.name !== subject.name) {
      const existing = await this.prisma.subject.findUnique({
        where: {
          workspaceId_name: { workspaceId: subject.workspaceId, name: dto.name },
        },
      });

      if (existing && existing.id !== subjectId) {
        throw new ConflictException('Subject with this name already exists');
      }
    }

    // Extract categoryIds from dto to handle separately
    const { categoryIds, ...updateData } = dto;

    // If categoryIds is provided, update the relationships
    if (categoryIds !== undefined) {
      // Use transaction to ensure atomicity
      return this.prisma.$transaction(async (tx) => {
        // Delete existing category connections
        await tx.subjectCategory.deleteMany({
          where: { subjectId },
        });

        // Create new category connections
        if (categoryIds.length > 0) {
          await tx.subjectCategory.createMany({
            data: categoryIds.map((categoryId) => ({
              subjectId,
              categoryId,
            })),
          });
        }

        // Update the subject itself
        return tx.subject.update({
          where: { id: subjectId },
          data: updateData,
          include: {
            categories: {
              include: {
                category: true,
              },
            },
          },
        });
      });
    }

    // Simple update without category changes
    return this.prisma.subject.update({
      where: { id: subjectId },
      data: updateData,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });
  }

  /**
   * Arquiva um subject (soft delete)
   */
  async archive(userId: string, subjectId: string) {
    await this.findOne(userId, subjectId);

    return this.prisma.subject.update({
      where: { id: subjectId },
      data: { archivedAt: new Date() },
    });
  }

  /**
   * Desarquiva um subject
   */
  async unarchive(userId: string, subjectId: string) {
    await this.findOne(userId, subjectId);

    return this.prisma.subject.update({
      where: { id: subjectId },
      data: { archivedAt: null },
    });
  }

  /**
   * Deleta permanentemente um subject arquivado
   * Remove todas as sessões de estudo, itens de ciclo, perfis e categorias associadas
   */
  async permanentDelete(userId: string, subjectId: string) {
    const subject = await this.findOne(userId, subjectId);

    // Apenas permitir deletar subjects arquivados
    if (!subject.archivedAt) {
      throw new BadRequestException(
        'Apenas tópicos arquivados podem ser deletados permanentemente',
      );
    }

    // Cascade delete já configurado no Prisma
    await this.prisma.subject.delete({
      where: { id: subjectId },
    });

    return { deleted: true, subjectId };
  }

  /**
   * Mescla múltiplos subjects em um target
   * Move todas as referências dos sources para o target, depois deleta os sources
   */
  async merge(userId: string, dto: MergeSubjectsDto) {
    // Verify all subjects belong to user and same workspace
    const subjects = await this.prisma.subject.findMany({
      where: { id: { in: [...dto.sourceIds, dto.targetId] } },
      include: { workspace: true },
    });

    if (subjects.length !== dto.sourceIds.length + 1) {
      throw new NotFoundException('One or more subjects not found');
    }

    const workspaceIds = new Set(subjects.map((s) => s.workspaceId));
    if (workspaceIds.size > 1) {
      throw new ForbiddenException('Cannot merge subjects from different workspaces');
    }

    const userIds = new Set(subjects.map((s) => s.workspace.userId));
    if (!userIds.has(userId)) {
      throw new ForbiddenException('Not authorized to merge these subjects');
    }

    // Use transaction to ensure atomicity
    return this.prisma.$transaction(async (tx) => {
      // Update all references to point to target
      await tx.studySession.updateMany({
        where: { subjectId: { in: dto.sourceIds } },
        data: { subjectId: dto.targetId },
      });

      await tx.studyCycleItem.updateMany({
        where: { subjectId: { in: dto.sourceIds } },
        data: { subjectId: dto.targetId },
      });

      await tx.subjectProfile.updateMany({
        where: { subjectId: { in: dto.sourceIds } },
        data: { subjectId: dto.targetId },
      });

      // Delete source subjects
      await tx.subject.deleteMany({
        where: { id: { in: dto.sourceIds } },
      });

      return tx.subject.findUnique({
        where: { id: dto.targetId },
      });
    });
  }

  /**
   * Reordena subjects no workspace
   */
  async reorder(userId: string, workspaceId: string, dto: ReorderSubjectsDto) {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    // Update positions in transaction
    return this.prisma.$transaction(
      dto.subjectIds.map((id, index) =>
        this.prisma.subject.update({
          where: { id },
          data: { position: index },
        }),
      ),
    );
  }

  /**
   * Helper: verifica se o workspace pertence ao usuário
   */
  private async verifyWorkspaceAccess(userId: string, workspaceId: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: { id: workspaceId, userId },
    });

    if (!workspace) {
      throw new ForbiddenException('Invalid workspace');
    }

    return workspace;
  }
}
