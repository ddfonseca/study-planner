import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Controller('api')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  /**
   * GET /api/workspaces/:workspaceId/categories
   * Lista todas as categorias do workspace
   */
  @Get('workspaces/:workspaceId/categories')
  async findAll(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
  ) {
    const userId = session.user.id;
    return this.categoryService.findAll(userId, workspaceId);
  }

  /**
   * POST /api/workspaces/:workspaceId/categories
   * Cria uma nova categoria
   */
  @Post('workspaces/:workspaceId/categories')
  async create(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    const userId = session.user.id;
    return this.categoryService.create(userId, workspaceId, dto);
  }

  /**
   * GET /api/categories/:id
   * Busca uma categoria por ID
   */
  @Get('categories/:id')
  async findOne(
    @Session() session: UserSession,
    @Param('id') id: string,
  ) {
    const userId = session.user.id;
    return this.categoryService.findOne(userId, id);
  }

  /**
   * PUT /api/categories/:id
   * Atualiza uma categoria
   */
  @Put('categories/:id')
  async update(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const userId = session.user.id;
    return this.categoryService.update(userId, id, dto);
  }

  /**
   * DELETE /api/categories/:id
   * Deleta uma categoria
   */
  @Delete('categories/:id')
  async delete(
    @Session() session: UserSession,
    @Param('id') id: string,
  ) {
    const userId = session.user.id;
    return this.categoryService.delete(userId, id);
  }
}
