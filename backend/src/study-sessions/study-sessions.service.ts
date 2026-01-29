import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudySessionDto, UpdateStudySessionDto } from './dto';

@Injectable()
export class StudySessionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Busca todas as matérias distintas de um usuário ou workspace
   * @deprecated Use SubjectService.findAll instead
   * @param workspaceId - ID do workspace ou "all" para todos os workspaces do usuário
   */
  async getDistinctSubjects(
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

    const subjects = await this.prisma.subject.findMany({
      where: {
        ...where,
        archivedAt: null,
      },
      select: { name: true },
      orderBy: { name: 'asc' },
    });

    return subjects.map((s) => s.name);
  }

  /**
   * Busca todas as sessões de estudo de um usuário
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

    return this.prisma.studySession.findMany({
      where,
      include: {
        subject: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  /**
   * Cria uma nova sessão de estudo
   */
  async create(userId: string, createDto: CreateStudySessionDto) {
    // Verificar se o workspace pertence ao usuário
    const workspace = await this.prisma.workspace.findFirst({
      where: { id: createDto.workspaceId, userId },
    });

    if (!workspace) {
      throw new ForbiddenException('Invalid workspace');
    }

    // Verificar se o subject existe e pertence ao workspace
    const subject = await this.prisma.subject.findFirst({
      where: { id: createDto.subjectId, workspaceId: createDto.workspaceId },
    });

    if (!subject) {
      throw new ForbiddenException('Invalid subject');
    }

    return this.prisma.studySession.create({
      data: {
        userId,
        workspaceId: createDto.workspaceId,
        subjectId: createDto.subjectId,
        date: new Date(createDto.date),
        minutes: createDto.minutes,
      },
      include: {
        subject: true,
      },
    });
  }

  /**
   * Atualiza uma sessão de estudo existente
   */
  async update(
    userId: string,
    sessionId: string,
    updateDto: UpdateStudySessionDto,
  ) {
    // Verifica se a sessão existe e pertence ao usuário
    const session = await this.prisma.studySession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Study session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Not authorized to update this session');
    }

    return this.prisma.studySession.update({
      where: { id: sessionId },
      data: updateDto,
      include: {
        subject: true,
      },
    });
  }

  /**
   * Deleta uma sessão de estudo
   */
  async delete(userId: string, sessionId: string) {
    // Verifica se a sessão existe e pertence ao usuário
    const session = await this.prisma.studySession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Study session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Not authorized to delete this session');
    }

    await this.prisma.studySession.delete({
      where: { id: sessionId },
    });

    return { success: true };
  }
}
