import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard';
import { StudySessionsService } from './study-sessions.service';
import { CreateStudySessionDto, UpdateStudySessionDto } from './dto';

@Controller('api/study-sessions')
@UseGuards(AuthGuard)
export class StudySessionsController {
  constructor(private studySessionsService: StudySessionsService) {}

  /**
   * GET /api/study-sessions?startDate=2024-01-01&endDate=2024-01-31
   * Lista todas as sessões de estudo do usuário, com filtro opcional por data
   */
  @Get()
  async getStudySessions(
    @Req() req: Request,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userId = req['user'].id;
    return this.studySessionsService.findByDateRange(
      userId,
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
    @Req() req: Request,
    @Body() createDto: CreateStudySessionDto,
  ) {
    const userId = req['user'].id;
    return this.studySessionsService.create(userId, createDto);
  }

  /**
   * PUT /api/study-sessions/:id
   * Atualiza uma sessão de estudo existente
   */
  @Put(':id')
  async updateStudySession(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateDto: UpdateStudySessionDto,
  ) {
    const userId = req['user'].id;
    return this.studySessionsService.update(userId, id, updateDto);
  }

  /**
   * DELETE /api/study-sessions/:id
   * Deleta uma sessão de estudo
   */
  @Delete(':id')
  async deleteStudySession(@Req() req: Request, @Param('id') id: string) {
    const userId = req['user'].id;
    return this.studySessionsService.delete(userId, id);
  }
}
