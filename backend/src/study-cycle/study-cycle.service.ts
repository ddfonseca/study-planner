import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { CreateStudyCycleDto, UpdateStudyCycleDto } from './dto';

export interface CycleItemProgress {
  subject: string;
  targetMinutes: number;
  accumulatedMinutes: number;
  isComplete: boolean;
  position: number;
}

export interface CycleStatistics {
  totalTargetMinutes: number;
  totalAccumulatedMinutes: number;
  completedItemsCount: number;
  totalItemsCount: number;
  overallPercentage: number;
  averagePerItem: number;
}

export interface CycleHistoryEntry {
  id: string;
  type: 'advance' | 'completion';
  fromSubject?: string;
  toSubject?: string;
  minutesSpent?: number;
  cycleName?: string;
  totalTargetMinutes?: number;
  totalSpentMinutes?: number;
  itemsCount?: number;
  timestamp: Date;
}

export interface CycleHistory {
  entries: CycleHistoryEntry[];
  totalAdvances: number;
  totalCompletions: number;
}

export interface CycleSuggestion {
  hasCycle: boolean;
  isEmpty: boolean;
  suggestion: {
    currentSubject: string;
    currentTargetMinutes: number;
    currentAccumulatedMinutes: number;
    remainingMinutes: number;
    isCurrentComplete: boolean;
    nextSubject: string;
    nextTargetMinutes: number;
    currentPosition: number;
    totalItems: number;
    allItemsProgress: CycleItemProgress[];
    isCycleComplete: boolean;
  } | null;
}

@Injectable()
export class StudyCycleService {
  constructor(
    private prisma: PrismaService,
    private subscriptionService: SubscriptionService,
  ) {}


  /**
   * Verifica se o usuário tem acesso ao workspace
   */
  private async verifyWorkspaceAccess(userId: string, workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.userId !== userId) {
      throw new ForbiddenException('Not authorized to access this workspace');
    }

    return workspace;
  }

  /**
   * Busca o ciclo ativo de um workspace (com itens ordenados)
   */
  async getCycle(userId: string, workspaceId: string) {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    return this.prisma.studyCycle.findFirst({
      where: { workspaceId, isActive: true },
      include: {
        items: {
          include: { subject: true },
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  /**
   * Lista todos os ciclos de um workspace
   */
  async listCycles(userId: string, workspaceId: string) {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    return this.prisma.studyCycle.findMany({
      where: { workspaceId },
      orderBy: [{ isActive: 'desc' }, { displayOrder: 'asc' }, { name: 'asc' }],
      include: {
        items: {
          include: { subject: true },
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  /**
   * Ativa um ciclo específico (desativa os outros)
   */
  async activateCycle(userId: string, workspaceId: string, cycleId: string) {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    // Verify the cycle exists and belongs to this workspace
    const cycle = await this.prisma.studyCycle.findFirst({
      where: { id: cycleId, workspaceId },
    });

    if (!cycle) {
      throw new NotFoundException('Cycle not found');
    }

    // Deactivate all cycles in this workspace
    await this.prisma.studyCycle.updateMany({
      where: { workspaceId },
      data: { isActive: false },
    });

    // Activate the selected cycle
    return this.prisma.studyCycle.update({
      where: { id: cycleId },
      data: { isActive: true },
      include: {
        items: {
          include: { subject: true },
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  /**
   * Cria um novo ciclo
   */
  async create(userId: string, workspaceId: string, dto: CreateStudyCycleDto) {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    // Check subscription limit for cycles
    const currentCount = await this.prisma.studyCycle.count({
      where: { workspaceId },
    });
    await this.subscriptionService.enforceFeatureLimit(
      userId,
      'max_cycles',
      currentCount,
      'Limite de ciclos de estudo atingido. Faça upgrade para criar mais.',
    );

    // Check if name already exists
    const existing = await this.prisma.studyCycle.findFirst({
      where: { workspaceId, name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('A cycle with this name already exists');
    }

    // Get current max displayOrder
    const maxOrder = await this.prisma.studyCycle.aggregate({
      where: { workspaceId },
      _max: { displayOrder: true },
    });
    const nextOrder = (maxOrder._max.displayOrder ?? -1) + 1;

    // Check if this is the first cycle (auto-activate)
    const cycleCount = await this.prisma.studyCycle.count({
      where: { workspaceId },
    });
    const shouldActivate = cycleCount === 0;

    // If activating this cycle, deactivate others first
    if (shouldActivate || dto.activateOnCreate) {
      await this.prisma.studyCycle.updateMany({
        where: { workspaceId },
        data: { isActive: false },
      });
    }

    // Create new cycle with items
    return this.prisma.studyCycle.create({
      data: {
        workspaceId,
        name: dto.name,
        isActive: shouldActivate || dto.activateOnCreate === true,
        displayOrder: nextOrder,
        currentItemIndex: 0,
        items: {
          create: dto.items.map((item, index) => ({
            subjectId: item.subjectId,
            targetMinutes: item.targetMinutes,
            position: index,
          })),
        },
      },
      include: {
        items: {
          include: { subject: true },
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  /**
   * Atualiza ciclo ativo existente
   */
  async update(userId: string, workspaceId: string, dto: UpdateStudyCycleDto) {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    const cycle = await this.prisma.studyCycle.findFirst({
      where: { workspaceId, isActive: true },
    });

    if (!cycle) {
      throw new NotFoundException('Study cycle not found');
    }

    // Se items foram enviados, recriar todos
    if (dto.items) {
      // Deletar items existentes
      await this.prisma.studyCycleItem.deleteMany({
        where: { cycleId: cycle.id },
      });

      // Criar novos items
      await this.prisma.studyCycleItem.createMany({
        data: dto.items.map((item, index) => ({
          cycleId: cycle.id,
          subjectId: item.subjectId,
          targetMinutes: item.targetMinutes,
          position: index,
        })),
      });

      // Validar currentItemIndex
      const newIndex = dto.currentItemIndex ?? cycle.currentItemIndex;
      const validIndex = Math.min(newIndex, dto.items.length - 1);

      return this.prisma.studyCycle.update({
        where: { id: cycle.id },
        data: {
          name: dto.name !== undefined ? dto.name : undefined,
          isActive: dto.isActive !== undefined ? dto.isActive : undefined,
          currentItemIndex: validIndex,
        },
        include: {
          items: {
            include: { subject: true },
            orderBy: { position: 'asc' },
          },
        },
      });
    }

    // Atualização simples sem mudar items
    return this.prisma.studyCycle.update({
      where: { id: cycle.id },
      data: {
        name: dto.name !== undefined ? dto.name : undefined,
        isActive: dto.isActive !== undefined ? dto.isActive : undefined,
        currentItemIndex: dto.currentItemIndex !== undefined ? dto.currentItemIndex : undefined,
      },
      include: {
        items: {
          include: { subject: true },
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  /**
   * Deleta o ciclo de um workspace
   */
  async delete(userId: string, workspaceId: string) {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    await this.prisma.studyCycle.deleteMany({
      where: { workspaceId },
    });

    return { success: true };
  }

  /**
   * Avança para o próximo item do ciclo ativo
   * @param forceComplete - Se true, adiciona compensação para considerar a matéria como completa
   */
  async advanceToNext(userId: string, workspaceId: string, forceComplete?: boolean) {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    const cycle = await this.prisma.studyCycle.findFirst({
      where: { workspaceId, isActive: true },
      include: {
        items: {
          include: { subject: true },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!cycle) {
      throw new NotFoundException('Study cycle not found');
    }

    if (cycle.items.length === 0) {
      throw new BadRequestException('Cycle has no items');
    }

    const currentIndex = cycle.currentItemIndex;
    const currentItem = cycle.items[currentIndex];

    // Circular: volta ao início quando chega no final
    const nextIndex = (currentIndex + 1) % cycle.items.length;
    const nextItem = cycle.items[nextIndex];

    // Get accumulated minutes for current subject (considering lastResetAt)
    const sessionsAgg = await this.prisma.studySession.aggregate({
      where: {
        workspaceId,
        subjectId: currentItem.subjectId,
        ...(cycle.lastResetAt && { createdAt: { gte: cycle.lastResetAt } }),
      },
      _sum: { minutes: true },
    });
    const sessionMinutes = sessionsAgg._sum.minutes || 0;
    const totalAccumulated = sessionMinutes + (currentItem.compensationMinutes || 0);

    // If forceComplete and not yet complete, add compensation
    if (forceComplete) {
      const remainingMinutes = Math.max(0, currentItem.targetMinutes - totalAccumulated);
      if (remainingMinutes > 0) {
        await this.prisma.studyCycleItem.update({
          where: { id: currentItem.id },
          data: {
            compensationMinutes: (currentItem.compensationMinutes || 0) + remainingMinutes,
          },
        });
      }
    }

    // Record advance in history (use subject names for display)
    await this.prisma.studyCycleAdvance.create({
      data: {
        cycleId: cycle.id,
        fromSubject: currentItem.subject.name,
        toSubject: nextItem.subject.name,
        fromPosition: currentIndex,
        toPosition: nextIndex,
        minutesSpent: totalAccumulated,
      },
    });

    // If completing the cycle (returning to position 0), record completion
    if (nextIndex === 0) {
      const totalTarget = cycle.items.reduce((sum, item) => sum + item.targetMinutes, 0);

      // Get total accumulated for all subjects (including compensation)
      const allSessionsAgg = await this.prisma.studySession.groupBy({
        by: ['subjectId'],
        where: {
          workspaceId,
          ...(cycle.lastResetAt && { createdAt: { gte: cycle.lastResetAt } }),
        },
        _sum: { minutes: true },
      });
      const subjectMinutes = allSessionsAgg.reduce(
        (acc, s) => {
          acc[s.subjectId] = s._sum.minutes || 0;
          return acc;
        },
        {} as Record<string, number>,
      );
      const totalSpent = cycle.items.reduce(
        (sum, item) => sum + (subjectMinutes[item.subjectId] || 0) + (item.compensationMinutes || 0),
        0,
      );

      await this.prisma.studyCycleCompletion.create({
        data: {
          cycleId: cycle.id,
          cycleName: cycle.name,
          totalTargetMinutes: totalTarget,
          totalSpentMinutes: totalSpent,
          itemsCount: cycle.items.length,
        },
      });
    }

    return this.prisma.studyCycle.update({
      where: { id: cycle.id },
      data: { currentItemIndex: nextIndex },
      include: {
        items: {
          include: { subject: true },
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  /**
   * Retorna a sugestão de estudo atual baseada no ciclo ativo
   */
  async getSuggestion(userId: string, workspaceId: string): Promise<CycleSuggestion> {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    const cycle = await this.prisma.studyCycle.findFirst({
      where: { workspaceId, isActive: true },
      include: {
        items: {
          include: { subject: true },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!cycle || !cycle.isActive) {
      return { hasCycle: false, isEmpty: false, suggestion: null };
    }

    if (cycle.items.length === 0) {
      return { hasCycle: true, isEmpty: true, suggestion: null };
    }

    // Buscar minutos acumulados por matéria das sessões (filtrado por lastResetAt)
    // Usa createdAt (timestamp completo) para filtrar corretamente
    const sessionsAgg = await this.prisma.studySession.groupBy({
      by: ['subjectId'],
      where: {
        workspaceId,
        ...(cycle.lastResetAt && { createdAt: { gte: cycle.lastResetAt } }),
      },
      _sum: { minutes: true },
    });

    const subjectMinutes = sessionsAgg.reduce(
      (acc, s) => {
        acc[s.subjectId] = s._sum.minutes || 0;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Enriquecer items com progresso calculado (sessões + compensação)
    const itemsWithProgress = cycle.items.map((item) => ({
      ...item,
      accumulatedMinutes: (subjectMinutes[item.subjectId] || 0) + (item.compensationMinutes || 0),
    }));

    const currentItem = itemsWithProgress[cycle.currentItemIndex];
    const remainingMinutes = Math.max(
      0,
      currentItem.targetMinutes - currentItem.accumulatedMinutes,
    );
    const isComplete = remainingMinutes === 0;

    // Próximo item (circular)
    const nextIndex = (cycle.currentItemIndex + 1) % itemsWithProgress.length;
    const nextItem = itemsWithProgress[nextIndex];

    // Build progress for all items (use subject name for display)
    const allItemsProgress: CycleItemProgress[] = itemsWithProgress.map((item) => ({
      subject: item.subject.name,
      targetMinutes: item.targetMinutes,
      accumulatedMinutes: item.accumulatedMinutes,
      isComplete: item.accumulatedMinutes >= item.targetMinutes,
      position: item.position,
    }));

    // Check if entire cycle is complete
    const isCycleComplete = allItemsProgress.every((item) => item.isComplete);

    return {
      hasCycle: true,
      isEmpty: false,
      suggestion: {
        currentSubject: currentItem.subject.name,
        currentTargetMinutes: currentItem.targetMinutes,
        currentAccumulatedMinutes: currentItem.accumulatedMinutes,
        remainingMinutes,
        isCurrentComplete: isComplete,
        nextSubject: nextItem.subject.name,
        nextTargetMinutes: nextItem.targetMinutes,
        currentPosition: cycle.currentItemIndex,
        totalItems: itemsWithProgress.length,
        allItemsProgress,
        isCycleComplete,
      },
    };
  }

  /**
   * Retorna estatísticas do ciclo ativo
   */
  async getStatistics(userId: string, workspaceId: string): Promise<CycleStatistics | null> {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    const cycle = await this.prisma.studyCycle.findFirst({
      where: { workspaceId, isActive: true },
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!cycle || !cycle.isActive || cycle.items.length === 0) {
      return null;
    }

    // Buscar minutos acumulados por matéria das sessões (filtrado por lastResetAt)
    // Usa createdAt (timestamp completo) para filtrar corretamente
    const sessionsAgg = await this.prisma.studySession.groupBy({
      by: ['subjectId'],
      where: {
        workspaceId,
        ...(cycle.lastResetAt && { createdAt: { gte: cycle.lastResetAt } }),
      },
      _sum: { minutes: true },
    });

    const subjectMinutes = sessionsAgg.reduce(
      (acc, s) => {
        acc[s.subjectId] = s._sum.minutes || 0;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Calcular estatísticas (sessões + compensação)
    const totalTargetMinutes = cycle.items.reduce((sum, item) => sum + item.targetMinutes, 0);
    const totalAccumulatedMinutes = cycle.items.reduce(
      (sum, item) => sum + (subjectMinutes[item.subjectId] || 0) + (item.compensationMinutes || 0),
      0,
    );

    const completedItemsCount = cycle.items.filter(
      (item) => (subjectMinutes[item.subjectId] || 0) + (item.compensationMinutes || 0) >= item.targetMinutes,
    ).length;

    const totalItemsCount = cycle.items.length;
    const overallPercentage =
      totalTargetMinutes > 0
        ? Math.min(100, Math.round((totalAccumulatedMinutes / totalTargetMinutes) * 100))
        : 0;
    const averagePerItem =
      totalItemsCount > 0 ? Math.round(totalAccumulatedMinutes / totalItemsCount) : 0;

    return {
      totalTargetMinutes,
      totalAccumulatedMinutes,
      completedItemsCount,
      totalItemsCount,
      overallPercentage,
      averagePerItem,
    };
  }

  /**
   * Retorna histórico de avanços e completudes do ciclo
   */
  async getHistory(
    userId: string,
    workspaceId: string,
    limit = 20,
  ): Promise<CycleHistory | null> {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    const cycle = await this.prisma.studyCycle.findFirst({
      where: { workspaceId, isActive: true },
    });

    if (!cycle) {
      return null;
    }

    // Get advances
    const advances = await this.prisma.studyCycleAdvance.findMany({
      where: { cycleId: cycle.id },
      orderBy: { advancedAt: 'desc' },
      take: limit,
    });

    // Get completions
    const completions = await this.prisma.studyCycleCompletion.findMany({
      where: { cycleId: cycle.id },
      orderBy: { completedAt: 'desc' },
      take: limit,
    });

    // Merge and sort by timestamp
    const entries: CycleHistoryEntry[] = [
      ...advances.map((a) => ({
        id: a.id,
        type: 'advance' as const,
        fromSubject: a.fromSubject,
        toSubject: a.toSubject,
        minutesSpent: a.minutesSpent,
        timestamp: a.advancedAt,
      })),
      ...completions.map((c) => ({
        id: c.id,
        type: 'completion' as const,
        cycleName: c.cycleName || undefined,
        totalTargetMinutes: c.totalTargetMinutes,
        totalSpentMinutes: c.totalSpentMinutes,
        itemsCount: c.itemsCount,
        timestamp: c.completedAt,
      })),
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);

    // Get total counts
    const totalAdvances = await this.prisma.studyCycleAdvance.count({
      where: { cycleId: cycle.id },
    });
    const totalCompletions = await this.prisma.studyCycleCompletion.count({
      where: { cycleId: cycle.id },
    });

    return {
      entries,
      totalAdvances,
      totalCompletions,
    };
  }

  /**
   * Reseta o ciclo ativo (zera progresso mantendo sessões)
   */
  async resetCycle(userId: string, workspaceId: string) {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    const cycle = await this.prisma.studyCycle.findFirst({
      where: { workspaceId, isActive: true },
    });

    if (!cycle) {
      throw new NotFoundException('Study cycle not found');
    }

    // Reset compensation minutes for all items
    await this.prisma.studyCycleItem.updateMany({
      where: { cycleId: cycle.id },
      data: { compensationMinutes: 0 },
    });

    return this.prisma.studyCycle.update({
      where: { id: cycle.id },
      data: {
        lastResetAt: new Date(),
        currentItemIndex: 0,
      },
      include: {
        items: {
          include: { subject: true },
          orderBy: { position: 'asc' },
        },
      },
    });
  }
}
