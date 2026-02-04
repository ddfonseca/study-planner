import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDisciplineDto, UpdateDisciplineDto } from './dto';

@Injectable()
export class DisciplineService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lista todas as disciplinas de um workspace
   */
  async findAll(userId: string, workspaceId: string) {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    return this.prisma.discipline.findMany({
      where: { workspaceId },
      orderBy: { position: 'asc' },
      include: {
        subjects: {
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
          select: { subjects: true },
        },
      },
    });
  }

  /**
   * Busca uma disciplina por ID
   */
  async findOne(userId: string, disciplineId: string) {
    const discipline = await this.prisma.discipline.findUnique({
      where: { id: disciplineId },
      include: {
        workspace: true,
        subjects: {
          where: { archivedAt: null },
          orderBy: { position: 'asc' },
        },
        _count: {
          select: { subjects: true },
        },
      },
    });

    if (!discipline) {
      throw new NotFoundException('Discipline not found');
    }

    if (discipline.workspace.userId !== userId) {
      throw new ForbiddenException('Not authorized to access this discipline');
    }

    return discipline;
  }

  /**
   * Cria uma nova disciplina
   */
  async create(userId: string, workspaceId: string, dto: CreateDisciplineDto) {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    // Check for duplicate name in workspace
    const existing = await this.prisma.discipline.findUnique({
      where: {
        workspaceId_name: { workspaceId, name: dto.name },
      },
    });

    if (existing) {
      throw new ConflictException('Discipline with this name already exists');
    }

    // Get max position if not provided
    let position = dto.position;
    if (position === undefined) {
      const maxPosition = await this.prisma.discipline.aggregate({
        where: { workspaceId },
        _max: { position: true },
      });
      position = (maxPosition._max.position ?? -1) + 1;
    }

    // Create discipline and optionally link subjects
    const discipline = await this.prisma.$transaction(async (tx) => {
      const created = await tx.discipline.create({
        data: {
          workspaceId,
          name: dto.name,
          color: dto.color,
          icon: dto.icon,
          position,
        },
      });

      // Link subjects if provided
      if (dto.subjectIds && dto.subjectIds.length > 0) {
        await tx.subject.updateMany({
          where: {
            id: { in: dto.subjectIds },
            workspaceId,
          },
          data: {
            disciplineId: created.id,
          },
        });
      }

      return created;
    });

    // Return with subjects populated
    return this.findOne(userId, discipline.id);
  }

  /**
   * Atualiza uma disciplina
   */
  async update(userId: string, disciplineId: string, dto: UpdateDisciplineDto) {
    const discipline = await this.findOne(userId, disciplineId);

    // If changing name, check for duplicates
    if (dto.name && dto.name !== discipline.name) {
      const existing = await this.prisma.discipline.findUnique({
        where: {
          workspaceId_name: {
            workspaceId: discipline.workspaceId,
            name: dto.name,
          },
        },
      });

      if (existing && existing.id !== disciplineId) {
        throw new ConflictException('Discipline with this name already exists');
      }
    }

    // Update discipline and subjects in transaction
    await this.prisma.$transaction(async (tx) => {
      // Update discipline fields
      await tx.discipline.update({
        where: { id: disciplineId },
        data: {
          name: dto.name,
          color: dto.color,
          icon: dto.icon,
          position: dto.position,
        },
      });

      // If subjectIds is provided, update subject assignments
      if (dto.subjectIds !== undefined) {
        // Remove all subjects from this discipline
        await tx.subject.updateMany({
          where: { disciplineId },
          data: { disciplineId: null },
        });

        // Add specified subjects to this discipline
        if (dto.subjectIds.length > 0) {
          await tx.subject.updateMany({
            where: {
              id: { in: dto.subjectIds },
              workspaceId: discipline.workspaceId,
            },
            data: { disciplineId },
          });
        }
      }
    });

    return this.findOne(userId, disciplineId);
  }

  /**
   * Adiciona subjects a uma disciplina
   */
  async addSubjects(
    userId: string,
    disciplineId: string,
    subjectIds: string[],
  ) {
    const discipline = await this.findOne(userId, disciplineId);

    await this.prisma.subject.updateMany({
      where: {
        id: { in: subjectIds },
        workspaceId: discipline.workspaceId,
      },
      data: { disciplineId },
    });

    return this.findOne(userId, disciplineId);
  }

  /**
   * Remove subjects de uma disciplina
   */
  async removeSubjects(
    userId: string,
    disciplineId: string,
    subjectIds: string[],
  ) {
    if (!subjectIds || !Array.isArray(subjectIds) || subjectIds.length === 0) {
      throw new BadRequestException('subjectIds é obrigatório e deve conter pelo menos um ID');
    }

    await this.findOne(userId, disciplineId);

    await this.prisma.subject.updateMany({
      where: {
        id: { in: subjectIds },
        disciplineId,
      },
      data: { disciplineId: null },
    });

    return this.findOne(userId, disciplineId);
  }

  /**
   * Deleta uma disciplina
   * Os subjects terão disciplineId setado para null (OnDelete: SetNull)
   */
  async delete(userId: string, disciplineId: string) {
    await this.findOne(userId, disciplineId);

    return this.prisma.discipline.delete({
      where: { id: disciplineId },
    });
  }

  /**
   * Reordena as disciplinas
   */
  async reorder(
    userId: string,
    workspaceId: string,
    orderedIds: string[],
  ) {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.discipline.update({
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
