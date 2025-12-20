import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateConfigDto } from './dto';

@Injectable()
export class ConfigService {
  constructor(private prisma: PrismaService) {}

  /**
   * Busca a configuração do usuário
   * Cria uma configuração padrão se não existir
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
          minHours: 20, // 20 hours per week (default)
          desHours: 30, // 30 hours per week (default)
          weekStartDay: 1, // Monday (default)
        },
      });
    }

    return config;
  }

  /**
   * Atualiza a configuração do usuário
   */
  async update(userId: string, updateDto: UpdateConfigDto) {
    // Validação adicional: minHours não pode ser maior que desHours
    if (
      updateDto.minHours !== undefined &&
      updateDto.desHours !== undefined &&
      updateDto.desHours > 0 &&
      updateDto.minHours > updateDto.desHours
    ) {
      throw new Error(
        'Minimum hours cannot be greater than desired hours',
      );
    }

    // Tenta atualizar, se não existir, cria
    try {
      return await this.prisma.userConfig.update({
        where: { userId },
        data: updateDto,
      });
    } catch (error) {
      // Se não existir, cria com os valores fornecidos
      return await this.prisma.userConfig.create({
        data: {
          userId,
          minHours: updateDto.minHours ?? 20,
          desHours: updateDto.desHours ?? 30,
          weekStartDay: 1,
        },
      });
    }
  }
}
