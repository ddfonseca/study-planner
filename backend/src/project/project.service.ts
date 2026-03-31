import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lista todos os projects de um workspace
   */
  async findAll(userId: string, workspaceId: string) {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    return this.prisma.project.findMany({
      where: { workspaceId },
      orderBy: { position: 'asc' },
      include: {
        tasks: {
          where: { archivedAt: null },
          orderBy: { position: 'asc' },
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });
  }

  /**
   * Busca um project por ID
   */
  async findOne(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        workspace: true,
        tasks: {
          where: { archivedAt: null },
          orderBy: { position: 'asc' },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.workspace.userId !== userId) {
      throw new ForbiddenException('Not authorized to access this project');
    }

    return project;
  }

  /**
   * Cria um novo project
   */
  async create(userId: string, workspaceId: string, dto: CreateProjectDto) {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    // Check for duplicate name in workspace
    const existing = await this.prisma.project.findUnique({
      where: {
        workspaceId_name: { workspaceId, name: dto.name },
      },
    });

    if (existing) {
      throw new ConflictException('Project with this name already exists');
    }

    // Get max position if not provided
    let position = dto.position;
    if (position === undefined) {
      const maxPosition = await this.prisma.project.aggregate({
        where: { workspaceId },
        _max: { position: true },
      });
      position = (maxPosition._max.position ?? -1) + 1;
    }

    // Create project and optionally link tasks
    const project = await this.prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          workspaceId,
          name: dto.name,
          color: dto.color,
          icon: dto.icon,
          position,
        },
      });

      // Link tasks if provided
      if (dto.taskIds && dto.taskIds.length > 0) {
        await tx.task.updateMany({
          where: {
            id: { in: dto.taskIds },
            workspaceId,
          },
          data: {
            disciplineId: created.id,
          },
        });
      }

      return created;
    });

    // Return with tasks populated
    return this.findOne(userId, project.id);
  }

  /**
   * Atualiza um project
   */
  async update(userId: string, projectId: string, dto: UpdateProjectDto) {
    const project = await this.findOne(userId, projectId);

    // If changing name, check for duplicates
    if (dto.name && dto.name !== project.name) {
      const existing = await this.prisma.project.findUnique({
        where: {
          workspaceId_name: {
            workspaceId: project.workspaceId,
            name: dto.name,
          },
        },
      });

      if (existing && existing.id !== projectId) {
        throw new ConflictException('Project with this name already exists');
      }
    }

    // Update project and tasks in transaction
    await this.prisma.$transaction(async (tx) => {
      // Update project fields
      await tx.project.update({
        where: { id: projectId },
        data: {
          name: dto.name,
          color: dto.color,
          icon: dto.icon,
          position: dto.position,
        },
      });

      // If taskIds is provided, update task assignments
      if (dto.taskIds !== undefined) {
        // Remove all tasks from this project
        await tx.task.updateMany({
          where: { disciplineId: projectId },
          data: { disciplineId: null },
        });

        // Add specified tasks to this project
        if (dto.taskIds.length > 0) {
          await tx.task.updateMany({
            where: {
              id: { in: dto.taskIds },
              workspaceId: project.workspaceId,
            },
            data: { disciplineId: projectId },
          });
        }
      }
    });

    return this.findOne(userId, projectId);
  }

  /**
   * Adiciona tasks a um project
   */
  async addTasks(
    userId: string,
    projectId: string,
    taskIds: string[],
  ) {
    const project = await this.findOne(userId, projectId);

    await this.prisma.task.updateMany({
      where: {
        id: { in: taskIds },
        workspaceId: project.workspaceId,
      },
      data: { disciplineId: projectId },
    });

    return this.findOne(userId, projectId);
  }

  /**
   * Remove tasks de um project
   */
  async removeTasks(
    userId: string,
    projectId: string,
    taskIds: string[],
  ) {
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      throw new BadRequestException('taskIds é obrigatório e deve conter pelo menos um ID');
    }

    await this.findOne(userId, projectId);

    await this.prisma.task.updateMany({
      where: {
        id: { in: taskIds },
        disciplineId: projectId,
      },
      data: { disciplineId: null },
    });

    return this.findOne(userId, projectId);
  }

  /**
   * Deleta um project
   * Os tasks terão disciplineId setado para null (OnDelete: SetNull)
   */
  async delete(userId: string, projectId: string) {
    await this.findOne(userId, projectId);

    return this.prisma.project.delete({
      where: { id: projectId },
    });
  }

  /**
   * Reordena os projects
   */
  async reorder(
    userId: string,
    workspaceId: string,
    orderedIds: string[],
  ) {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.project.update({
          where: { id },
          data: { position: index },
        }),
      ),
    );

    return this.findAll(userId, workspaceId);
  }

  /**
   * Helper: verifica se o workspace pertence ao usuario
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
