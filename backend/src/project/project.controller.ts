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
import { ProjectService } from './project.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';

@Controller('api')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  /**
   * GET /api/workspaces/:workspaceId/projects
   * Lista todos os projects do workspace
   */
  @Get('workspaces/:workspaceId/projects')
  async findAll(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
  ) {
    const userId = session.user.id;
    return this.projectService.findAll(userId, workspaceId);
  }

  /**
   * POST /api/workspaces/:workspaceId/projects
   * Cria um novo project
   */
  @Post('workspaces/:workspaceId/projects')
  async create(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateProjectDto,
  ) {
    const userId = session.user.id;
    return this.projectService.create(userId, workspaceId, dto);
  }

  /**
   * GET /api/projects/:id
   * Busca um project por ID
   */
  @Get('projects/:id')
  async findOne(@Session() session: UserSession, @Param('id') id: string) {
    const userId = session.user.id;
    return this.projectService.findOne(userId, id);
  }

  /**
   * PUT /api/projects/:id
   * Atualiza um project
   */
  @Put('projects/:id')
  async update(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    const userId = session.user.id;
    return this.projectService.update(userId, id, dto);
  }

  /**
   * POST /api/projects/:id/tasks
   * Adiciona tasks a um project
   */
  @Post('projects/:id/tasks')
  async addTasks(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() body: { taskIds: string[] },
  ) {
    const userId = session.user.id;
    return this.projectService.addTasks(userId, id, body.taskIds);
  }

  /**
   * DELETE /api/projects/:id/tasks
   * Remove tasks de um project
   */
  @Delete('projects/:id/tasks')
  async removeTasks(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() body: { taskIds: string[] },
  ) {
    const userId = session.user.id;
    return this.projectService.removeTasks(userId, id, body.taskIds);
  }

  /**
   * PUT /api/workspaces/:workspaceId/projects/reorder
   * Reordena os projects
   */
  @Put('workspaces/:workspaceId/projects/reorder')
  async reorder(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
    @Body() body: { orderedIds: string[] },
  ) {
    const userId = session.user.id;
    return this.projectService.reorder(userId, workspaceId, body.orderedIds);
  }

  /**
   * DELETE /api/projects/:id
   * Deleta um project
   */
  @Delete('projects/:id')
  async delete(@Session() session: UserSession, @Param('id') id: string) {
    const userId = session.user.id;
    return this.projectService.delete(userId, id);
  }
}
