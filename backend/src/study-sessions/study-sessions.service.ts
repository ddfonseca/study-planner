import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudySessionDto, UpdateStudySessionDto } from './dto';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  isActiveToday: boolean;
  totalStudyDays: number;
}

export interface ReviewSuggestion {
  subject: string;
  lastStudyDate: string;
  daysSinceStudy: number;
  totalMinutesStudied: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  suggestedReviewDate: string;
}

@Injectable()
export class StudySessionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Busca todas as matérias distintas de um usuário ou workspace
   * @param workspaceId - ID do workspace ou "all" para todos os workspaces do usuário
   */
  async getDistinctSubjects(
    userId: string,
    workspaceId?: string,
  ): Promise<string[]> {
    const where: any = { userId };

    if (workspaceId && workspaceId !== 'all') {
      where.workspaceId = workspaceId;
    }

    const subjects = await this.prisma.studySession.findMany({
      where,
      select: { subject: true },
      distinct: ['subject'],
      orderBy: { subject: 'asc' },
    });

    return subjects.map((s) => s.subject);
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

    return this.prisma.studySession.create({
      data: {
        userId,
        workspaceId: createDto.workspaceId,
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

  /**
   * Calcula os dados de streak (sequência de dias estudados)
   * @param workspaceId - ID do workspace ou "all" para todos os workspaces
   */
  async getStreak(userId: string, workspaceId?: string): Promise<StreakData> {
    const where: any = { userId };

    if (workspaceId && workspaceId !== 'all') {
      where.workspaceId = workspaceId;
    }

    // Get all unique study dates ordered descending
    const studyDates = await this.prisma.studySession.findMany({
      where,
      select: { date: true },
      distinct: ['date'],
      orderBy: { date: 'desc' },
    });

    if (studyDates.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: null,
        isActiveToday: false,
        totalStudyDays: 0,
      };
    }

    // Convert dates to YYYY-MM-DD strings for comparison
    const dateStrings = studyDates.map((d) => {
      const date = new Date(d.date);
      return date.toISOString().split('T')[0];
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const isActiveToday = dateStrings[0] === todayStr;
    const lastStudyDate = dateStrings[0];

    // Calculate current streak
    let currentStreak = 0;
    let checkDate = isActiveToday ? todayStr : yesterdayStr;

    // Only count current streak if studied today or yesterday
    if (dateStrings[0] === todayStr || dateStrings[0] === yesterdayStr) {
      for (const dateStr of dateStrings) {
        if (dateStr === checkDate) {
          currentStreak++;
          const d = new Date(checkDate);
          d.setDate(d.getDate() - 1);
          checkDate = d.toISOString().split('T')[0];
        } else if (dateStr < checkDate) {
          break;
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 1;

    // Sort dates ascending for longest streak calculation
    const sortedDates = [...dateStrings].sort();

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.round(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      currentStreak,
      longestStreak,
      lastStudyDate,
      isActiveToday,
      totalStudyDays: dateStrings.length,
    };
  }

  /**
   * Calcula sugestões de revisão baseadas em repetição espaçada
   * Usa uma versão simplificada da curva de esquecimento
   * @param workspaceId - ID do workspace ou "all" para todos os workspaces
   */
  async getReviewSuggestions(
    userId: string,
    workspaceId?: string,
  ): Promise<ReviewSuggestion[]> {
    const where: any = { userId };

    if (workspaceId && workspaceId !== 'all') {
      where.workspaceId = workspaceId;
    }

    // Get all sessions grouped by subject with their last study date and total time
    const sessions = await this.prisma.studySession.findMany({
      where,
      select: {
        subject: true,
        date: true,
        minutes: true,
      },
      orderBy: { date: 'desc' },
    });

    if (sessions.length === 0) {
      return [];
    }

    // Group by subject
    const subjectData = new Map<
      string,
      { lastDate: Date; totalMinutes: number }
    >();

    for (const session of sessions) {
      const existing = subjectData.get(session.subject);
      if (!existing) {
        subjectData.set(session.subject, {
          lastDate: new Date(session.date),
          totalMinutes: session.minutes,
        });
      } else {
        existing.totalMinutes += session.minutes;
        // Keep the most recent date
        const sessionDate = new Date(session.date);
        if (sessionDate > existing.lastDate) {
          existing.lastDate = sessionDate;
        }
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const suggestions: ReviewSuggestion[] = [];

    for (const [subject, data] of subjectData) {
      const lastStudyDate = data.lastDate;
      lastStudyDate.setHours(0, 0, 0, 0);

      const daysSinceStudy = Math.floor(
        (today.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Skip if studied today
      if (daysSinceStudy === 0) {
        continue;
      }

      // Spaced repetition intervals (simplified):
      // Day 1: First review (urgency: low)
      // Day 3: Second review (urgency: medium)
      // Day 7: Third review (urgency: high)
      // Day 14+: Critical review needed
      let urgency: ReviewSuggestion['urgency'];
      let daysUntilReview: number;

      if (daysSinceStudy >= 14) {
        urgency = 'critical';
        daysUntilReview = 0; // Review immediately
      } else if (daysSinceStudy >= 7) {
        urgency = 'high';
        daysUntilReview = 0;
      } else if (daysSinceStudy >= 3) {
        urgency = 'medium';
        daysUntilReview = Math.max(0, 7 - daysSinceStudy);
      } else {
        urgency = 'low';
        daysUntilReview = Math.max(0, 3 - daysSinceStudy);
      }

      const suggestedReviewDate = new Date(today);
      suggestedReviewDate.setDate(suggestedReviewDate.getDate() + daysUntilReview);

      suggestions.push({
        subject,
        lastStudyDate: lastStudyDate.toISOString().split('T')[0],
        daysSinceStudy,
        totalMinutesStudied: data.totalMinutes,
        urgency,
        suggestedReviewDate: suggestedReviewDate.toISOString().split('T')[0],
      });
    }

    // Sort by urgency (critical first) then by days since study
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    suggestions.sort((a, b) => {
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return b.daysSinceStudy - a.daysSinceStudy;
    });

    return suggestions;
  }
}
