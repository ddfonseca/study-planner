import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateConfigDto } from './dto';

@Injectable()
export class ConfigService {
  constructor(private prisma: PrismaService) {}

  /**
   * Busca a configuração do usuário
   * Cria uma configuração padrão se não existir
   * Também garante que o usuário tenha um workspace default
   */
  async findByUserId(userId: string) {
    let config = await this.prisma.userConfig.findUnique({
      where: { userId },
    });

    // Se não existir, cria uma configuração padrão
    if (!config) {
      config = await this.prisma.userConfig.create({
        data: {
          userId,
          targetHours: 30, // 30 hours per week (default)
          weekStartDay: 1, // Monday (default)
        },
      });
    }

    // Garantir que o usuário tenha um workspace default
    await this.ensureDefaultWorkspace(userId);

    return config;
  }

  /**
   * Garante que o usuário tenha um workspace default
   */
  private async ensureDefaultWorkspace(userId: string) {
    const hasWorkspace = await this.prisma.workspace.findFirst({
      where: { userId, isDefault: true },
    });

    if (!hasWorkspace) {
      await this.prisma.workspace.create({
        data: {
          userId,
          name: 'Geral',
          color: '#6366f1',
          isDefault: true,
        },
      });
    }
  }

  /**
   * Atualiza a configuração do usuário
   */
  async update(userId: string, updateDto: UpdateConfigDto) {
    // Tenta atualizar, se não existir, cria
    try {
      return await this.prisma.userConfig.update({
        where: { userId },
        data: updateDto,
      });
    } catch {
      // Se não existir, cria com os valores fornecidos
      return await this.prisma.userConfig.create({
        data: {
          userId,
          targetHours: updateDto.targetHours ?? 30,
          weekStartDay: 1,
        },
      });
    }
  }
}
