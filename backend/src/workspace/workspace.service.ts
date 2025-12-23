import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from './dto';

@Injectable()
export class WorkspaceService {
  constructor(
    private prisma: PrismaService,
    private subscriptionService: SubscriptionService,
  ) {}

  /**
   * Lista todos os workspaces de um usuário
   */
  async findAll(userId: string) {
    return this.prisma.workspace.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  /**
   * Busca um workspace por ID
   */
  async findById(userId: string, workspaceId: string) {
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
   * Cria um novo workspace
   */
  async create(userId: string, createDto: CreateWorkspaceDto) {
    // Verificar limite de workspaces via subscription
    await this.subscriptionService.enforceFeatureLimit(
      userId,
      'max_workspaces',
      await this.prisma.workspace.count({ where: { userId } }),
      'Limite de workspaces atingido. Faça upgrade para criar mais.',
    );

    // Verificar nome duplicado
    const existing = await this.prisma.workspace.findUnique({
      where: {
        userId_name: { userId, name: createDto.name },
      },
    });

    if (existing) {
      throw new BadRequestException('A workspace with this name already exists');
    }

    return this.prisma.workspace.create({
      data: {
        userId,
        name: createDto.name,
        color: createDto.color,
        isDefault: false,
      },
    });
  }

  /**
   * Atualiza um workspace existente
   */
  async update(userId: string, workspaceId: string, updateDto: UpdateWorkspaceDto) {
    const workspace = await this.findById(userId, workspaceId);

    // Se está mudando o nome, verificar duplicidade
    if (updateDto.name && updateDto.name !== workspace.name) {
      const existing = await this.prisma.workspace.findUnique({
        where: {
          userId_name: { userId, name: updateDto.name },
        },
      });

      if (existing) {
        throw new BadRequestException('A workspace with this name already exists');
      }
    }

    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: updateDto,
    });
  }

  /**
   * Deleta um workspace
   * @param moveToDefault Se true, move sessões para o workspace default antes de deletar
   */
  async delete(userId: string, workspaceId: string, moveToDefault: boolean = false) {
    const workspace = await this.findById(userId, workspaceId);

    if (workspace.isDefault) {
      throw new BadRequestException('Cannot delete the default workspace');
    }

    if (moveToDefault) {
      // Buscar workspace default
      const defaultWorkspace = await this.prisma.workspace.findFirst({
        where: { userId, isDefault: true },
      });

      if (!defaultWorkspace) {
        throw new BadRequestException('No default workspace found');
      }

      // Mover sessões para workspace default
      await this.prisma.studySession.updateMany({
        where: { workspaceId },
        data: { workspaceId: defaultWorkspace.id },
      });

      // Mover ou deletar metas semanais
      // Como metas são únicas por (userId, workspaceId, weekStart), precisamos deletar
      // as metas do workspace que está sendo deletado para evitar conflitos
      await this.prisma.weeklyGoal.deleteMany({
        where: { workspaceId },
      });
    }

    // Deletar o workspace (cascade deleta sessões e metas se moveToDefault=false)
    await this.prisma.workspace.delete({
      where: { id: workspaceId },
    });

    return { success: true };
  }

  /**
   * Cria o workspace default "Geral" para um novo usuário
   */
  async createDefaultForUser(userId: string) {
    const existing = await this.prisma.workspace.findFirst({
      where: { userId, isDefault: true },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.workspace.create({
      data: {
        userId,
        name: 'Geral',
        color: '#6366f1',
        isDefault: true,
      },
    });
  }

  /**
   * Busca o workspace default do usuário
   */
  async getDefaultWorkspace(userId: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: { userId, isDefault: true },
    });

    if (!workspace) {
      // Criar automaticamente se não existir
      return this.createDefaultForUser(userId);
    }

    return workspace;
  }

  /**
   * Busca matérias distintas de um workspace
   */
  async getDistinctSubjects(userId: string, workspaceId: string): Promise<string[]> {
    // Verificar acesso ao workspace
    await this.findById(userId, workspaceId);

    const subjects = await this.prisma.studySession.findMany({
      where: { workspaceId },
      select: { subject: true },
      distinct: ['subject'],
      orderBy: { subject: 'asc' },
    });

    return subjects.map((s) => s.subject);
  }

  /**
   * Retorna estatísticas de um workspace
   */
  async getStats(userId: string, workspaceId: string) {
    await this.findById(userId, workspaceId);

    const [sessionsCount, totalMinutes] = await Promise.all([
      this.prisma.studySession.count({
        where: { workspaceId },
      }),
      this.prisma.studySession.aggregate({
        where: { workspaceId },
        _sum: { minutes: true },
      }),
    ]);

    return {
      sessionsCount,
      totalMinutes: totalMinutes._sum.minutes || 0,
    };
  }
}
