import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudyCycleDto, UpdateStudyCycleDto } from './dto';

export interface CycleSuggestion {
  hasCycle: boolean;
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
  } | null;
}

@Injectable()
export class StudyCycleService {
  constructor(private prisma: PrismaService) {}

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
   * Busca o ciclo de um workspace (com itens ordenados)
   */
  async getCycle(userId: string, workspaceId: string) {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    return this.prisma.studyCycle.findUnique({
      where: { workspaceId },
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  /**
   * Cria um novo ciclo (substitui existente)
   */
  async create(userId: string, workspaceId: string, dto: CreateStudyCycleDto) {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    // Deletar ciclo existente se houver
    await this.prisma.studyCycle.deleteMany({
      where: { workspaceId },
    });

    // Criar novo ciclo com itens
    return this.prisma.studyCycle.create({
      data: {
        workspaceId,
        name: dto.name,
        isActive: true,
        currentItemIndex: 0,
        items: {
          create: dto.items.map((item, index) => ({
            subject: item.subject,
            targetMinutes: item.targetMinutes,
            position: index,
          })),
        },
      },
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  /**
   * Atualiza ciclo existente
   */
  async update(userId: string, workspaceId: string, dto: UpdateStudyCycleDto) {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    const cycle = await this.prisma.studyCycle.findUnique({
      where: { workspaceId },
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
          subject: item.subject,
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
   * Avança para o próximo item do ciclo
   */
  async advanceToNext(userId: string, workspaceId: string) {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    const cycle = await this.prisma.studyCycle.findUnique({
      where: { workspaceId },
      include: { items: true },
    });

    if (!cycle) {
      throw new NotFoundException('Study cycle not found');
    }

    if (cycle.items.length === 0) {
      throw new BadRequestException('Cycle has no items');
    }

    // Circular: volta ao início quando chega no final
    const nextIndex = (cycle.currentItemIndex + 1) % cycle.items.length;

    return this.prisma.studyCycle.update({
      where: { id: cycle.id },
      data: { currentItemIndex: nextIndex },
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  /**
   * Retorna a sugestão de estudo atual baseada no ciclo
   */
  async getSuggestion(userId: string, workspaceId: string): Promise<CycleSuggestion> {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    const cycle = await this.prisma.studyCycle.findUnique({
      where: { workspaceId },
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!cycle || !cycle.isActive || cycle.items.length === 0) {
      return { hasCycle: false, suggestion: null };
    }

    // Buscar minutos acumulados por matéria das sessões
    const sessionsAgg = await this.prisma.studySession.groupBy({
      by: ['subject'],
      where: { workspaceId },
      _sum: { minutes: true },
    });

    const subjectMinutes = sessionsAgg.reduce(
      (acc, s) => {
        acc[s.subject] = s._sum.minutes || 0;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Enriquecer items com progresso calculado
    const itemsWithProgress = cycle.items.map((item) => ({
      ...item,
      accumulatedMinutes: subjectMinutes[item.subject] || 0,
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

    return {
      hasCycle: true,
      suggestion: {
        currentSubject: currentItem.subject,
        currentTargetMinutes: currentItem.targetMinutes,
        currentAccumulatedMinutes: currentItem.accumulatedMinutes,
        remainingMinutes,
        isCurrentComplete: isComplete,
        nextSubject: nextItem.subject,
        nextTargetMinutes: nextItem.targetMinutes,
        currentPosition: cycle.currentItemIndex,
        totalItems: itemsWithProgress.length,
      },
    };
  }
}
