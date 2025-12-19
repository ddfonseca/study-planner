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
   * Busca todas as sessões de estudo de um usuário
   * Pode filtrar por intervalo de datas
   */
  async findByDateRange(
    userId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = {
      userId,
    };

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
      orderBy: {
        date: 'asc',
      },
    });
  }

  /**
   * Cria uma nova sessão de estudo
   */
  async create(userId: string, createDto: CreateStudySessionDto) {
    return this.prisma.studySession.create({
      data: {
        userId,
        date: new Date(createDto.date),
        subject: createDto.subject,
        minutes: createDto.minutes,
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
