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
import { WorkSessionService } from './work-session.service';
import { CreateWorkSessionDto, UpdateWorkSessionDto } from './dto';

@Controller('api/work-sessions')
export class WorkSessionController {
  constructor(private workSessionService: WorkSessionService) {}

  /**
   * GET /api/work-sessions/tasks?workspaceId=xxx
   * Lista todas as tasks distintas do workspace
   * workspaceId pode ser "all" para listar de todos os workspaces
   */
  @Get('tasks')
  async getDistinctTasks(
    @Session() session: UserSession,
    @Query('workspaceId') workspaceId?: string,
  ): Promise<string[]> {
    const userId = session.user.id;
    return this.workSessionService.getDistinctTasks(userId, workspaceId);
  }

  /**
   * GET /api/work-sessions?workspaceId=xxx&startDate=2024-01-01&endDate=2024-01-31
   * Lista todas as work sessions do usuário, filtradas por workspace e opcionalmente por data
   * workspaceId pode ser "all" para listar de todos os workspaces
   */
  @Get()
  async getWorkSessions(
    @Session() session: UserSession,
    @Query('workspaceId') workspaceId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userId = session.user.id;
    return this.workSessionService.findByDateRange(
      userId,
      workspaceId,
      startDate,
      endDate,
    );
  }

  /**
   * POST /api/work-sessions
   * Cria uma nova work session
   */
  @Post()
  async createWorkSession(
    @Session() session: UserSession,
    @Body() createDto: CreateWorkSessionDto,
  ) {
    const userId = session.user.id;
    return this.workSessionService.create(userId, createDto);
  }

  /**
   * PUT /api/work-sessions/:id
   * Atualiza uma work session existente
   */
  @Put(':id')
  async updateWorkSession(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() updateDto: UpdateWorkSessionDto,
  ) {
    const userId = session.user.id;
    return this.workSessionService.update(userId, id, updateDto);
  }

  /**
   * DELETE /api/work-sessions/:id
   * Deleta uma work session
   */
  @Delete(':id')
  async deleteWorkSession(
    @Session() session: UserSession,
    @Param('id') id: string,
  ) {
    const userId = session.user.id;
    return this.workSessionService.delete(userId, id);
  }
}
