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
import { ExamProfileService } from './exam-profile.service';
import { CreateExamProfileDto, UpdateExamProfileDto } from './dto';

@Controller('api/exam-profiles')
export class ExamProfileController {
  constructor(private examProfileService: ExamProfileService) {}

  /**
   * GET /api/exam-profiles?workspaceId=xxx
   * Lista todos os profiles de um workspace
   */
  @Get()
  async list(
    @Session() session: UserSession,
    @Query('workspaceId') workspaceId: string,
  ) {
    const userId = session.user.id;
    return this.examProfileService.list(userId, workspaceId);
  }

  /**
   * POST /api/exam-profiles
   * Cria um novo profile com subjects
   */
  @Post()
  async create(
    @Session() session: UserSession,
    @Body() dto: CreateExamProfileDto,
  ) {
    const userId = session.user.id;
    return this.examProfileService.create(userId, dto);
  }

  /**
   * GET /api/exam-profiles/:id
   * Busca um profile específico com seus subjects
   */
  @Get(':id')
  async findOne(@Session() session: UserSession, @Param('id') id: string) {
    const userId = session.user.id;
    return this.examProfileService.findOne(userId, id);
  }

  /**
   * PUT /api/exam-profiles/:id
   * Atualiza um profile
   */
  @Put(':id')
  async update(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: UpdateExamProfileDto,
  ) {
    const userId = session.user.id;
    return this.examProfileService.update(userId, id, dto);
  }

  /**
   * DELETE /api/exam-profiles/:id
   * Deleta um profile
   */
  @Delete(':id')
  async delete(@Session() session: UserSession, @Param('id') id: string) {
    const userId = session.user.id;
    return this.examProfileService.delete(userId, id);
  }

  /**
   * POST /api/exam-profiles/:id/calculate
   * Calcula alocação de tempo para o profile
   */
  @Post(':id/calculate')
  async calculateAllocation(
    @Session() session: UserSession,
    @Param('id') id: string,
  ) {
    return this.examProfileService.calculateAllocation(id);
  }
}
