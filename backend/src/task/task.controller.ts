import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { TaskService } from './task.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  MergeTasksDto,
  ReorderTasksDto,
} from './dto';

@Controller('api')
export class TaskController {
  constructor(private taskService: TaskService) {}

  /**
   * GET /api/workspaces/:workspaceId/tasks
   * Lista todos os tasks do workspace
   */
  @Get('workspaces/:workspaceId/tasks')
  async findAll(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    const userId = session.user.id;
    return this.taskService.findAll(
      userId,
      workspaceId,
      includeArchived === 'true',
    );
  }

  /**
   * POST /api/workspaces/:workspaceId/tasks
   * Cria um novo task
   */
  @Post('workspaces/:workspaceId/tasks')
  async create(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateTaskDto,
  ) {
    const userId = session.user.id;
    return this.taskService.create(userId, workspaceId, dto);
  }

  /**
   * POST /api/workspaces/:workspaceId/tasks/find-or-create
   * Cria um task se não existir, ou retorna o existente
   */
  @Post('workspaces/:workspaceId/tasks/find-or-create')
  async findOrCreate(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
    @Body('name') name: string,
  ) {
    const userId = session.user.id;
    return this.taskService.findOrCreate(userId, workspaceId, name);
  }

  /**
   * PUT /api/workspaces/:workspaceId/tasks/reorder
   * Reordena os tasks do workspace
   */
  @Put('workspaces/:workspaceId/tasks/reorder')
  async reorder(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: ReorderTasksDto,
  ) {
    const userId = session.user.id;
    return this.taskService.reorder(userId, workspaceId, dto);
  }

  /**
   * GET /api/tasks/:id
   * Busca um task por ID
   */
  @Get('tasks/:id')
  async findOne(
    @Session() session: UserSession,
    @Param('id') id: string,
  ) {
    const userId = session.user.id;
    return this.taskService.findOne(userId, id);
  }

  /**
   * PUT /api/tasks/:id
   * Atualiza um task
   */
  @Put('tasks/:id')
  async update(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    const userId = session.user.id;
    return this.taskService.update(userId, id, dto);
  }

  /**
   * DELETE /api/tasks/:id
   * Arquiva um task (soft delete)
   */
  @Delete('tasks/:id')
  async archive(
    @Session() session: UserSession,
    @Param('id') id: string,
  ) {
    const userId = session.user.id;
    return this.taskService.archive(userId, id);
  }

  /**
   * POST /api/tasks/:id/unarchive
   * Desarquiva um task
   */
  @Post('tasks/:id/unarchive')
  async unarchive(
    @Session() session: UserSession,
    @Param('id') id: string,
  ) {
    const userId = session.user.id;
    return this.taskService.unarchive(userId, id);
  }

  /**
   * DELETE /api/tasks/:id/permanent
   * Deleta permanentemente um task arquivado
   */
  @Delete('tasks/:id/permanent')
  async permanentDelete(
    @Session() session: UserSession,
    @Param('id') id: string,
  ) {
    const userId = session.user.id;
    return this.taskService.permanentDelete(userId, id);
  }

  /**
   * POST /api/tasks/merge
   * Mescla múltiplos tasks em um target
   */
  @Post('tasks/merge')
  async merge(
    @Session() session: UserSession,
    @Body() dto: MergeTasksDto,
  ) {
    const userId = session.user.id;
    return this.taskService.merge(userId, dto);
  }
}
