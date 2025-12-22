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
import { WorkspaceService } from './workspace.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from './dto';

@Controller('api/workspaces')
export class WorkspaceController {
  constructor(private workspaceService: WorkspaceService) {}

  /**
   * GET /api/workspaces
   * Lista todos os workspaces do usuário
   */
  @Get()
  async getAll(@Session() session: UserSession) {
    const userId = session.user.id;
    return this.workspaceService.findAll(userId);
  }

  /**
   * GET /api/workspaces/default
   * Retorna o workspace default do usuário (cria se não existir)
   */
  @Get('default')
  async getDefault(@Session() session: UserSession) {
    const userId = session.user.id;
    return this.workspaceService.getDefaultWorkspace(userId);
  }

  /**
   * GET /api/workspaces/:id
   * Retorna um workspace específico
   */
  @Get(':id')
  async getById(@Session() session: UserSession, @Param('id') id: string) {
    const userId = session.user.id;
    return this.workspaceService.findById(userId, id);
  }

  /**
   * GET /api/workspaces/:id/subjects
   * Lista matérias distintas do workspace
   */
  @Get(':id/subjects')
  async getSubjects(@Session() session: UserSession, @Param('id') id: string) {
    const userId = session.user.id;
    return this.workspaceService.getDistinctSubjects(userId, id);
  }

  /**
   * GET /api/workspaces/:id/stats
   * Retorna estatísticas do workspace
   */
  @Get(':id/stats')
  async getStats(@Session() session: UserSession, @Param('id') id: string) {
    const userId = session.user.id;
    return this.workspaceService.getStats(userId, id);
  }

  /**
   * POST /api/workspaces
   * Cria um novo workspace
   */
  @Post()
  async create(
    @Session() session: UserSession,
    @Body() createDto: CreateWorkspaceDto,
  ) {
    const userId = session.user.id;
    return this.workspaceService.create(userId, createDto);
  }

  /**
   * PUT /api/workspaces/:id
   * Atualiza um workspace existente
   */
  @Put(':id')
  async update(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() updateDto: UpdateWorkspaceDto,
  ) {
    const userId = session.user.id;
    return this.workspaceService.update(userId, id, updateDto);
  }

  /**
   * DELETE /api/workspaces/:id?moveToDefault=true
   * Deleta um workspace
   * @param moveToDefault Se true, move sessões para o workspace default
   */
  @Delete(':id')
  async delete(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Query('moveToDefault') moveToDefault?: string,
  ) {
    const userId = session.user.id;
    const shouldMove = moveToDefault === 'true';
    return this.workspaceService.delete(userId, id, shouldMove);
  }
}
