import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lista todas as categorias de um workspace
   */
  async findAll(userId: string, workspaceId: string) {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    return this.prisma.category.findMany({
      where: { workspaceId },
      orderBy: { position: 'asc' },
      include: {
        _count: {
          select: { subjects: true },
        },
      },
    });
  }

  /**
   * Busca uma categoria por ID
   */
  async findOne(userId: string, categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        workspace: true,
        _count: {
          select: { subjects: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.workspace.userId !== userId) {
      throw new ForbiddenException('Not authorized to access this category');
    }

    return category;
  }

  /**
   * Cria uma nova categoria
   */
  async create(userId: string, workspaceId: string, dto: CreateCategoryDto) {
    await this.verifyWorkspaceAccess(userId, workspaceId);

    // Check for duplicate name in workspace
    const existing = await this.prisma.category.findUnique({
      where: {
        workspaceId_name: { workspaceId, name: dto.name },
      },
    });

    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }

    // Get max position if not provided
    let position = dto.position;
    if (position === undefined) {
      const maxPosition = await this.prisma.category.aggregate({
        where: { workspaceId },
        _max: { position: true },
      });
      position = (maxPosition._max.position ?? -1) + 1;
    }

    return this.prisma.category.create({
      data: {
        workspaceId,
        name: dto.name,
        color: dto.color,
        position,
      },
    });
  }

  /**
   * Atualiza uma categoria
   */
  async update(userId: string, categoryId: string, dto: UpdateCategoryDto) {
    const category = await this.findOne(userId, categoryId);

    // If changing name, check for duplicates
    if (dto.name && dto.name !== category.name) {
      const existing = await this.prisma.category.findUnique({
        where: {
          workspaceId_name: { workspaceId: category.workspaceId, name: dto.name },
        },
      });

      if (existing && existing.id !== categoryId) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    return this.prisma.category.update({
      where: { id: categoryId },
      data: dto,
    });
  }

  /**
   * Deleta uma categoria
   * Os vínculos SubjectCategory serão deletados em cascade
   */
  async delete(userId: string, categoryId: string) {
    await this.findOne(userId, categoryId);

    return this.prisma.category.delete({
      where: { id: categoryId },
    });
  }

  /**
   * Helper: verifica se o workspace pertence ao usuário
   */
  private async verifyWorkspaceAccess(userId: string, workspaceId: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: { id: workspaceId, userId },
    });

    if (!workspace) {
      throw new ForbiddenException('Invalid workspace');
    }

    return workspace;
  }
}
