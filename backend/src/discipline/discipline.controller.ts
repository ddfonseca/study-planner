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
import { DisciplineService } from './discipline.service';
import { CreateDisciplineDto, UpdateDisciplineDto } from './dto';

@Controller('api')
export class DisciplineController {
  constructor(private disciplineService: DisciplineService) {}

  /**
   * GET /api/workspaces/:workspaceId/disciplines
   * Lista todas as disciplinas do workspace
   */
  @Get('workspaces/:workspaceId/disciplines')
  async findAll(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
  ) {
    const userId = session.user.id;
    return this.disciplineService.findAll(userId, workspaceId);
  }

  /**
   * POST /api/workspaces/:workspaceId/disciplines
   * Cria uma nova disciplina
   */
  @Post('workspaces/:workspaceId/disciplines')
  async create(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateDisciplineDto,
  ) {
    const userId = session.user.id;
    return this.disciplineService.create(userId, workspaceId, dto);
  }

  /**
   * GET /api/disciplines/:id
   * Busca uma disciplina por ID
   */
  @Get('disciplines/:id')
  async findOne(@Session() session: UserSession, @Param('id') id: string) {
    const userId = session.user.id;
    return this.disciplineService.findOne(userId, id);
  }

  /**
   * PUT /api/disciplines/:id
   * Atualiza uma disciplina
   */
  @Put('disciplines/:id')
  async update(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: UpdateDisciplineDto,
  ) {
    const userId = session.user.id;
    return this.disciplineService.update(userId, id, dto);
  }

  /**
   * POST /api/disciplines/:id/subjects
   * Adiciona subjects a uma disciplina
   */
  @Post('disciplines/:id/subjects')
  async addSubjects(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() body: { subjectIds: string[] },
  ) {
    const userId = session.user.id;
    return this.disciplineService.addSubjects(userId, id, body.subjectIds);
  }

  /**
   * DELETE /api/disciplines/:id/subjects
   * Remove subjects de uma disciplina
   */
  @Delete('disciplines/:id/subjects')
  async removeSubjects(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() body: { subjectIds: string[] },
  ) {
    const userId = session.user.id;
    return this.disciplineService.removeSubjects(userId, id, body.subjectIds);
  }

  /**
   * PUT /api/workspaces/:workspaceId/disciplines/reorder
   * Reordena as disciplinas
   */
  @Put('workspaces/:workspaceId/disciplines/reorder')
  async reorder(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
    @Body() body: { orderedIds: string[] },
  ) {
    const userId = session.user.id;
    return this.disciplineService.reorder(userId, workspaceId, body.orderedIds);
  }

  /**
   * DELETE /api/disciplines/:id
   * Deleta uma disciplina
   */
  @Delete('disciplines/:id')
  async delete(@Session() session: UserSession, @Param('id') id: string) {
    const userId = session.user.id;
    return this.disciplineService.delete(userId, id);
  }
}
