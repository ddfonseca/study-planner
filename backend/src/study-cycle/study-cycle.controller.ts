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
import { StudyCycleService } from './study-cycle.service';
import { CreateStudyCycleDto, UpdateStudyCycleDto } from './dto';

@Controller('api/workspaces/:workspaceId/cycle')
export class StudyCycleController {
  constructor(private studyCycleService: StudyCycleService) {}

  /**
   * GET /api/workspaces/:workspaceId/cycle
   * Retorna o ciclo do workspace
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
   * POST /api/workspaces/:workspaceId/cycle
   * Cria um novo ciclo (substitui existente)
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
   */
  @Post('advance')
  async advanceToNext(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
  ) {
    const userId = session.user.id;
    return this.studyCycleService.advanceToNext(userId, workspaceId);
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
