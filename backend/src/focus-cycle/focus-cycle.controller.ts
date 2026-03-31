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
import { FocusCycleService } from './focus-cycle.service';
import { CreateFocusCycleDto, UpdateFocusCycleDto } from './dto';

@Controller('api/workspaces/:workspaceId/focus-cycle')
export class FocusCycleController {
  constructor(private focusCycleService: FocusCycleService) {}

  /**
   * GET /api/workspaces/:workspaceId/focus-cycle
   * Retorna o ciclo ativo do workspace
   */
  @Get()
  async getCycle(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
  ) {
    const userId = session.user.id;
    return this.focusCycleService.getCycle(userId, workspaceId);
  }

  /**
   * GET /api/workspaces/:workspaceId/focus-cycle/list
   * Lista todos os ciclos do workspace
   */
  @Get('list')
  async listCycles(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
  ) {
    const userId = session.user.id;
    return this.focusCycleService.listCycles(userId, workspaceId);
  }

  /**
   * GET /api/workspaces/:workspaceId/focus-cycle/suggestion
   * Retorna a sugestão atual
   */
  @Get('suggestion')
  async getSuggestion(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
  ) {
    const userId = session.user.id;
    return this.focusCycleService.getSuggestion(userId, workspaceId);
  }

  /**
   * GET /api/workspaces/:workspaceId/focus-cycle/statistics
   * Retorna estatísticas do ciclo
   */
  @Get('statistics')
  async getStatistics(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
  ) {
    const userId = session.user.id;
    return this.focusCycleService.getStatistics(userId, workspaceId);
  }

  /**
   * GET /api/workspaces/:workspaceId/focus-cycle/history
   * Retorna histórico de avanços e completudes
   */
  @Get('history')
  async getHistory(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
    @Query('limit') limit?: string,
  ) {
    const userId = session.user.id;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.focusCycleService.getHistory(userId, workspaceId, limitNum);
  }

  /**
   * POST /api/workspaces/:workspaceId/focus-cycle/:cycleId/activate
   * Ativa um ciclo específico
   */
  @Post(':cycleId/activate')
  async activateCycle(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
    @Param('cycleId') cycleId: string,
  ) {
    const userId = session.user.id;
    return this.focusCycleService.activateCycle(userId, workspaceId, cycleId);
  }

  /**
   * POST /api/workspaces/:workspaceId/focus-cycle
   * Cria um novo ciclo
   */
  @Post()
  async create(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateFocusCycleDto,
  ) {
    const userId = session.user.id;
    return this.focusCycleService.create(userId, workspaceId, dto);
  }

  /**
   * PUT /api/workspaces/:workspaceId/focus-cycle
   * Atualiza o ciclo existente
   */
  @Put()
  async update(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpdateFocusCycleDto,
  ) {
    const userId = session.user.id;
    return this.focusCycleService.update(userId, workspaceId, dto);
  }

  /**
   * POST /api/workspaces/:workspaceId/focus-cycle/advance
   * Avança para o próximo item do ciclo
   * @param forceComplete - Se true, considera o item atual como completo (adiciona compensação)
   */
  @Post('advance')
  async advanceToNext(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
    @Body() body?: { forceComplete?: boolean },
  ) {
    const userId = session.user.id;
    return this.focusCycleService.advanceToNext(userId, workspaceId, body?.forceComplete);
  }

  /**
   * POST /api/workspaces/:workspaceId/focus-cycle/reset
   * Reseta o ciclo (zera progresso mantendo sessões)
   */
  @Post('reset')
  async resetCycle(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
  ) {
    const userId = session.user.id;
    return this.focusCycleService.resetCycle(userId, workspaceId);
  }

  /**
   * DELETE /api/workspaces/:workspaceId/focus-cycle
   * Deleta o ciclo do workspace
   */
  @Delete()
  async delete(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
  ) {
    const userId = session.user.id;
    return this.focusCycleService.delete(userId, workspaceId);
  }
}
