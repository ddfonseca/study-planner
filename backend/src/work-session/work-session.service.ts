import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkSessionDto, UpdateWorkSessionDto } from './dto';

@Injectable()
export class WorkSessionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Busca todas as tasks distintas de um usuário ou workspace
   * @deprecated Use TaskService.findAll instead
   * @param workspaceId - ID do workspace ou "all" para todos os workspaces do usuário
   */
  async getDistinctTasks(
    userId: string,
    workspaceId?: string,
  ): Promise<string[]> {
    const where: any = {};

    if (workspaceId && workspaceId !== 'all') {
      where.workspaceId = workspaceId;
    } else {
      // Get all workspaces for user
      const workspaces = await this.prisma.workspace.findMany({
        where: { userId },
        select: { id: true },
      });
      where.workspaceId = { in: workspaces.map((w) => w.id) };
    }

    const tasks = await this.prisma.task.findMany({
      where: {
        ...where,
        archivedAt: null,
      },
      select: { name: true },
      orderBy: { name: 'asc' },
    });

    return tasks.map((s) => s.name);
  }

  /**
   * Busca todas as work sessions de um usuário
   * Pode filtrar por workspace e intervalo de datas
   * @param workspaceId - ID do workspace ou "all" para todos os workspaces do usuário
   */
  async findByDateRange(
    userId: string,
    workspaceId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = {
      userId,
    };

    // Filtrar por workspace se não for "all"
    if (workspaceId && workspaceId !== 'all') {
      where.workspaceId = workspaceId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    return this.prisma.workSession.findMany({
      where,
      include: {
        task: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  /**
   * Cria uma nova work session
   */
  async create(userId: string, createDto: CreateWorkSessionDto) {
    // Verificar se o workspace pertence ao usuário
    const workspace = await this.prisma.workspace.findFirst({
      where: { id: createDto.workspaceId, userId },
    });

    if (!workspace) {
      throw new ForbiddenException('Invalid workspace');
    }

    // Verificar se o task existe e pertence ao workspace
    const task = await this.prisma.task.findFirst({
      where: { id: createDto.subjectId, workspaceId: createDto.workspaceId },
    });

    if (!task) {
      throw new ForbiddenException('Invalid task');
    }

    return this.prisma.workSession.create({
      data: {
        userId,
        workspaceId: createDto.workspaceId,
        subjectId: createDto.subjectId,
        date: new Date(createDto.date),
        minutes: createDto.minutes,
      },
      include: {
        task: true,
      },
    });
  }

  /**
   * Atualiza uma work session existente
   */
  async update(
    userId: string,
    sessionId: string,
    updateDto: UpdateWorkSessionDto,
  ) {
    // Verifica se a sessão existe e pertence ao usuário
    const session = await this.prisma.workSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Work session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Not authorized to update this session');
    }

    return this.prisma.workSession.update({
      where: { id: sessionId },
      data: updateDto,
      include: {
        task: true,
      },
    });
  }

  /**
   * Deleta uma work session
   */
  async delete(userId: string, sessionId: string) {
    // Verifica se a sessão existe e pertence ao usuário
    const session = await this.prisma.workSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Work session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Not authorized to delete this session');
    }

    await this.prisma.workSession.delete({
      where: { id: sessionId },
    });

    return { success: true };
  }
}
