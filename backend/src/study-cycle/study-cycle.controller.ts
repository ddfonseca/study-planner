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
import { StudyCycleService } from './study-cycle.service';
import { CreateStudyCycleDto, UpdateStudyCycleDto } from './dto';

@Controller('api/workspaces/:workspaceId/cycle')
export class StudyCycleController {
  constructor(private studyCycleService: StudyCycleService) {}

  /**
   * GET /api/workspaces/:workspaceId/cycle
   * Retorna o ciclo ativo do workspace
   */
  @Get()
  async getCycle(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
  ) {
    const userId = session.user.id;
    return this.studyCycleService.getCycle(userId, workspaceId);
  }

  /**
   * GET /api/workspaces/:workspaceId/cycle/list
   * Lista todos os ciclos do workspace
   */
  @Get('list')
  async listCycles(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
  ) {
    const userId = session.user.id;
    return this.studyCycleService.listCycles(userId, workspaceId);
  }

  /**
   * GET /api/workspaces/:workspaceId/cycle/suggestion
   * Retorna a sugestão de estudo atual
   */
  @Get('suggestion')
  async getSuggestion(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
  ) {
    const userId = session.user.id;
    return this.studyCycleService.getSuggestion(userId, workspaceId);
  }

  /**
   * GET /api/workspaces/:workspaceId/cycle/statistics
   * Retorna estatísticas do ciclo
   */
  @Get('statistics')
  async getStatistics(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
  ) {
    const userId = session.user.id;
    return this.studyCycleService.getStatistics(userId, workspaceId);
  }

  /**
   * GET /api/workspaces/:workspaceId/cycle/history
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
    return this.studyCycleService.getHistory(userId, workspaceId, limitNum);
  }

  /**
   * POST /api/workspaces/:workspaceId/cycle/:cycleId/activate
   * Ativa um ciclo específico
   */
  @Post(':cycleId/activate')
  async activateCycle(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
    @Param('cycleId') cycleId: string,
  ) {
    const userId = session.user.id;
    return this.studyCycleService.activateCycle(userId, workspaceId, cycleId);
  }

  /**
   * POST /api/workspaces/:workspaceId/cycle
   * Cria um novo ciclo
   */
  @Post()
  async create(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateStudyCycleDto,
  ) {
    const userId = session.user.id;
    return this.studyCycleService.create(userId, workspaceId, dto);
  }

  /**
   * PUT /api/workspaces/:workspaceId/cycle
   * Atualiza o ciclo existente
   */
  @Put()
  async update(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpdateStudyCycleDto,
  ) {
    const userId = session.user.id;
    return this.studyCycleService.update(userId, workspaceId, dto);
  }

  /**
   * POST /api/workspaces/:workspaceId/cycle/advance
   * Avança para o próximo item do ciclo
   * @param forceComplete - Se true, considera a matéria atual como completa (adiciona compensação)
   */
  @Post('advance')
  async advanceToNext(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
    @Body() body?: { forceComplete?: boolean },
  ) {
    const userId = session.user.id;
    return this.studyCycleService.advanceToNext(userId, workspaceId, body?.forceComplete);
  }

  /**
   * POST /api/workspaces/:workspaceId/cycle/reset
   * Reseta o ciclo (zera progresso mantendo sessões)
   */
  @Post('reset')
  async resetCycle(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
  ) {
    const userId = session.user.id;
    return this.studyCycleService.resetCycle(userId, workspaceId);
  }

  /**
   * DELETE /api/workspaces/:workspaceId/cycle
   * Deleta o ciclo do workspace
   */
  @Delete()
  async delete(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
  ) {
    const userId = session.user.id;
    return this.studyCycleService.delete(userId, workspaceId);
  }
}
