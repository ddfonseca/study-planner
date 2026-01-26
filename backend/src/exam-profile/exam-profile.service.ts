import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateExamProfileDto,
  UpdateExamProfileDto,
  AllocationResponseDto,
} from './dto';

@Injectable()
export class ExamProfileService {
  constructor(private prisma: PrismaService) {}

  /**
   * Verifica se o usuário tem acesso ao profile através do workspace
   */
  private async verifyProfileAccess(userId: string, profileId: string) {
    const profile = await this.prisma.examProfile.findUnique({
      where: { id: profileId },
      include: { workspace: true },
    });

    if (!profile) {
      throw new NotFoundException('Exam profile not found');
    }

    if (profile.workspace.userId !== userId) {
      throw new ForbiddenException('Not authorized to access this exam profile');
    }

    return profile;
  }

  /**
   * Lista todos os profiles de um workspace
   */
  async list(userId: string, workspaceId: string) {
    // Verify workspace access
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.userId !== userId) {
      throw new ForbiddenException('Not authorized to access this workspace');
    }

    return this.prisma.examProfile.findMany({
      where: { workspaceId },
      include: {
        subjects: {
          orderBy: { position: 'asc' },
        },
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  }

  /**
   * Cria um novo profile com subjects
   */
  async create(userId: string, dto: CreateExamProfileDto) {
    // Verify workspace access
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: dto.workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.userId !== userId) {
      throw new ForbiddenException('Not authorized to access this workspace');
    }

    // Check if name already exists in workspace
    const existing = await this.prisma.examProfile.findFirst({
      where: { workspaceId: dto.workspaceId, name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('A profile with this name already exists');
    }

    // Create profile with subjects
    return this.prisma.examProfile.create({
      data: {
        workspaceId: dto.workspaceId,
        name: dto.name,
        examDate: dto.examDate ? new Date(dto.examDate) : null,
        weeklyHours: dto.weeklyHours,
        subjects: {
          create: dto.subjects.map((subject, index) => ({
            subject: subject.subject,
            weight: subject.weight,
            currentLevel: subject.currentLevel,
            goalLevel: subject.goalLevel,
            position: subject.position ?? index,
          })),
        },
      },
      include: {
        subjects: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  /**
   * Busca um profile com seus subjects
   */
  async findOne(userId: string, profileId: string) {
    const profile = await this.verifyProfileAccess(userId, profileId);

    return this.prisma.examProfile.findUnique({
      where: { id: profileId },
      include: {
        subjects: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  /**
   * Atualiza um profile
   */
  async update(userId: string, profileId: string, dto: UpdateExamProfileDto) {
    await this.verifyProfileAccess(userId, profileId);

    // Se subjects foram enviados, recriar todos
    if (dto.subjects) {
      // Deletar subjects existentes
      await this.prisma.subjectProfile.deleteMany({
        where: { examProfileId: profileId },
      });

      // Criar novos subjects
      await this.prisma.subjectProfile.createMany({
        data: dto.subjects.map((subject, index) => ({
          examProfileId: profileId,
          subject: subject.subject,
          weight: subject.weight,
          currentLevel: subject.currentLevel,
          goalLevel: subject.goalLevel,
          position: subject.position ?? index,
        })),
      });
    }

    // Atualizar profile
    return this.prisma.examProfile.update({
      where: { id: profileId },
      data: {
        name: dto.name !== undefined ? dto.name : undefined,
        examDate: dto.examDate !== undefined ? new Date(dto.examDate) : undefined,
        weeklyHours: dto.weeklyHours !== undefined ? dto.weeklyHours : undefined,
        isActive: dto.isActive !== undefined ? dto.isActive : undefined,
      },
      include: {
        subjects: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  /**
   * Deleta um profile
   */
  async delete(userId: string, profileId: string) {
    await this.verifyProfileAccess(userId, profileId);

    await this.prisma.examProfile.delete({
      where: { id: profileId },
    });

    return { success: true };
  }

  /**
   * Calcula a alocação de tempo baseada no perfil
   * Usa horas totais até a data da prova
   */
  async calculateAllocation(profileId: string): Promise<AllocationResponseDto> {
    const profile = await this.prisma.examProfile.findUnique({
      where: { id: profileId },
      include: {
        subjects: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Exam profile not found');
    }

    if (!profile.examDate) {
      throw new BadRequestException('Exam date is required for allocation calculation');
    }

    // Calculate weeks until exam
    const now = new Date();
    const examDate = new Date(profile.examDate);
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const weeksUntilExam = Math.max(0, Math.ceil((examDate.getTime() - now.getTime()) / msPerWeek));

    // Calculate total available hours
    const totalAvailableHours = weeksUntilExam * profile.weeklyHours;

    if (profile.subjects.length === 0) {
      return {
        results: [],
        metadata: {
          weeksUntilExam,
          totalAvailableHours,
          weeklyHours: profile.weeklyHours,
          examDate: profile.examDate.toISOString().split('T')[0],
        },
      };
    }

    // Calculate allocation using the algorithm
    const scores = profile.subjects.map((s) => {
      const gap = Math.max(0, s.goalLevel - s.currentLevel);
      const rawScore = gap * s.weight * (1 + Math.log10(1 + gap));
      return {
        subject: s.subject,
        gap,
        rawScore,
        weight: s.weight,
      };
    });

    const totalScore = scores.reduce((sum, s) => sum + s.rawScore, 0);

    const results = scores.map((s) => {
      const percentage = totalScore > 0 ? (s.rawScore / totalScore) * 100 : 100 / scores.length;
      const totalHours = totalScore > 0
        ? Math.round((s.rawScore / totalScore) * totalAvailableHours * 10) / 10
        : totalAvailableHours / scores.length;
      const hoursPerWeek = weeksUntilExam > 0
        ? Math.round((totalHours / weeksUntilExam) * 10) / 10
        : 0;

      return {
        subject: s.subject,
        totalHours,
        hoursPerWeek,
        gap: s.gap,
        percentage,
      };
    });

    return {
      results,
      metadata: {
        weeksUntilExam,
        totalAvailableHours,
        weeklyHours: profile.weeklyHours,
        examDate: profile.examDate.toISOString().split('T')[0],
      },
    };
  }
}
