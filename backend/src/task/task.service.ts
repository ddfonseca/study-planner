import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  MergeTasksDto,
  ReorderTasksDto,
} from './dto';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lista todos os tasks de um workspace
   */
  async findAll(
    userId: string,
    workspaceId: string,
    includeArchived = false,
  ) {
    // Verify workspace belongs to user
    await this.verifyWorkspaceAccess(userId, workspaceId);

    return this.prisma.task.findMany({
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
   * Busca um task por ID
   */
  async findOne(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        workspace: true,
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.workspace.userId !== userId) {
      throw new ForbiddenException('Not authorized to access this task');
    }

    return task;
  }

  /**
   * Cria um novo task
   */
  async create(userId: string, workspaceId: string, dto: CreateTaskDto) {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    // Check for duplicate name in workspace
    const existing = await this.prisma.task.findUnique({
      where: {
        workspaceId_name: { workspaceId, name: dto.name },
      },
    });

    if (existing) {
      throw new ConflictException('Task with this name already exists');
    }

    // Get max position if not provided
    let position = dto.position;
    if (position === undefined) {
      const maxPosition = await this.prisma.task.aggregate({
        where: { workspaceId },
        _max: { position: true },
      });
      position = (maxPosition._max.position ?? -1) + 1;
    }

    // Create task with optional category connections
    return this.prisma.task.create({
      data: {
        workspaceId,
        name: dto.name,
        color: dto.color,
        icon: dto.icon,
        position,
        disciplineId: dto.projectId,
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
   * Cria um task se não existir, ou retorna o existente
   * Usado para manter a UX de criar inline
   */
  async findOrCreate(userId: string, workspaceId: string, name: string) {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    // Check if already exists
    const existing = await this.prisma.task.findUnique({
      where: {
        workspaceId_name: { workspaceId, name },
      },
    });

    if (existing) {
      // If archived, unarchive it
      if (existing.archivedAt) {
        return this.prisma.task.update({
          where: { id: existing.id },
          data: { archivedAt: null },
        });
      }
      return existing;
    }

    // Create new task
    const maxPosition = await this.prisma.task.aggregate({
      where: { workspaceId },
      _max: { position: true },
    });

    return this.prisma.task.create({
      data: {
        workspaceId,
        name,
        position: (maxPosition._max.position ?? -1) + 1,
      },
    });
  }

  /**
   * Atualiza um task
   */
  async update(userId: string, taskId: string, dto: UpdateTaskDto) {
    const task = await this.findOne(userId, taskId);

    // If changing name, check for duplicates
    if (dto.name && dto.name !== task.name) {
      const existing = await this.prisma.task.findUnique({
        where: {
          workspaceId_name: { workspaceId: task.workspaceId, name: dto.name },
        },
      });

      if (existing && existing.id !== taskId) {
        throw new ConflictException('Task with this name already exists');
      }
    }

    // Extract categoryIds from dto to handle separately
    const { categoryIds, ...updateData } = dto;

    // If categoryIds is provided, update the relationships
    if (categoryIds !== undefined) {
      // Use transaction to ensure atomicity
      return this.prisma.$transaction(async (tx) => {
        // Delete existing category connections
        await tx.taskCategory.deleteMany({
          where: { subjectId: taskId },
        });

        // Create new category connections
        if (categoryIds.length > 0) {
          await tx.taskCategory.createMany({
            data: categoryIds.map((categoryId) => ({
              subjectId: taskId,
              categoryId,
            })),
          });
        }

        // Update the task itself
        return tx.task.update({
          where: { id: taskId },
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
    return this.prisma.task.update({
      where: { id: taskId },
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
   * Arquiva um task (soft delete)
   */
  async archive(userId: string, taskId: string) {
    await this.findOne(userId, taskId);

    return this.prisma.task.update({
      where: { id: taskId },
      data: { archivedAt: new Date() },
    });
  }

  /**
   * Desarquiva um task
   */
  async unarchive(userId: string, taskId: string) {
    await this.findOne(userId, taskId);

    return this.prisma.task.update({
      where: { id: taskId },
      data: { archivedAt: null },
    });
  }

  /**
   * Deleta permanentemente um task arquivado
   * Remove todas as work sessions, itens de ciclo, perfis e categorias associadas
   */
  async permanentDelete(userId: string, taskId: string) {
    const task = await this.findOne(userId, taskId);

    // Apenas permitir deletar tasks arquivados
    if (!task.archivedAt) {
      throw new BadRequestException(
        'Apenas tópicos arquivados podem ser deletados permanentemente',
      );
    }

    // Cascade delete já configurado no Prisma
    await this.prisma.task.delete({
      where: { id: taskId },
    });

    return { deleted: true, taskId };
  }

  /**
   * Mescla múltiplos tasks em um target
   * Move todas as referências dos sources para o target, depois deleta os sources
   */
  async merge(userId: string, dto: MergeTasksDto) {
    // Verify all tasks belong to user and same workspace
    const tasks = await this.prisma.task.findMany({
      where: { id: { in: [...dto.sourceIds, dto.targetId] } },
      include: { workspace: true },
    });

    if (tasks.length !== dto.sourceIds.length + 1) {
      throw new NotFoundException('One or more tasks not found');
    }

    const workspaceIds = new Set(tasks.map((s) => s.workspaceId));
    if (workspaceIds.size > 1) {
      throw new ForbiddenException('Cannot merge tasks from different workspaces');
    }

    const userIds = new Set(tasks.map((s) => s.workspace.userId));
    if (!userIds.has(userId)) {
      throw new ForbiddenException('Not authorized to merge these tasks');
    }

    // Use transaction to ensure atomicity
    return this.prisma.$transaction(async (tx) => {
      // Update all references to point to target
      await tx.workSession.updateMany({
        where: { subjectId: { in: dto.sourceIds } },
        data: { subjectId: dto.targetId },
      });

      await tx.focusCycleItem.updateMany({
        where: { subjectId: { in: dto.sourceIds } },
        data: { subjectId: dto.targetId },
      });

      // Delete source tasks
      await tx.task.deleteMany({
        where: { id: { in: dto.sourceIds } },
      });

      return tx.task.findUnique({
        where: { id: dto.targetId },
      });
    });
  }

  /**
   * Reordena tasks no workspace
   */
  async reorder(userId: string, workspaceId: string, dto: ReorderTasksDto) {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    // Update positions in transaction
    return this.prisma.$transaction(
      dto.taskIds.map((id, index) =>
        this.prisma.task.update({
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
