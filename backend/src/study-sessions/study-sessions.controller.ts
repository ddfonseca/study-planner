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
import { StudySessionsService } from './study-sessions.service';
import { CreateStudySessionDto, UpdateStudySessionDto } from './dto';

@Controller('api/study-sessions')
export class StudySessionsController {
  constructor(private studySessionsService: StudySessionsService) {}

  /**
   * GET /api/study-sessions/subjects?workspaceId=xxx
   * Lista todas as matérias distintas do workspace
   * workspaceId pode ser "all" para listar de todos os workspaces
   */
  @Get('subjects')
  async getDistinctSubjects(
    @Session() session: UserSession,
    @Query('workspaceId') workspaceId?: string,
  ): Promise<string[]> {
    const userId = session.user.id;
    return this.studySessionsService.getDistinctSubjects(userId, workspaceId);
  }

  /**
   * GET /api/study-sessions?workspaceId=xxx&startDate=2024-01-01&endDate=2024-01-31
   * Lista todas as sessões de estudo do usuário, filtradas por workspace e opcionalmente por data
   * workspaceId pode ser "all" para listar de todos os workspaces
   */
  @Get()
  async getStudySessions(
    @Session() session: UserSession,
    @Query('workspaceId') workspaceId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userId = session.user.id;
    return this.studySessionsService.findByDateRange(
      userId,
      workspaceId,
      startDate,
      endDate,
    );
  }

  /**
   * POST /api/study-sessions
   * Cria uma nova sessão de estudo
   */
  @Post()
  async createStudySession(
    @Session() session: UserSession,
    @Body() createDto: CreateStudySessionDto,
  ) {
    const userId = session.user.id;
    return this.studySessionsService.create(userId, createDto);
  }

  /**
   * PUT /api/study-sessions/:id
   * Atualiza uma sessão de estudo existente
   */
  @Put(':id')
  async updateStudySession(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() updateDto: UpdateStudySessionDto,
  ) {
    const userId = session.user.id;
    return this.studySessionsService.update(userId, id, updateDto);
  }

  /**
   * DELETE /api/study-sessions/:id
   * Deleta uma sessão de estudo
   */
  @Delete(':id')
  async deleteStudySession(
    @Session() session: UserSession,
    @Param('id') id: string,
  ) {
    const userId = session.user.id;
    return this.studySessionsService.delete(userId, id);
  }
}
