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
import { SubjectService } from './subject.service';
import {
  CreateSubjectDto,
  UpdateSubjectDto,
  MergeSubjectsDto,
  ReorderSubjectsDto,
} from './dto';

@Controller('api')
export class SubjectController {
  constructor(private subjectService: SubjectService) {}

  /**
   * GET /api/workspaces/:workspaceId/subjects
   * Lista todos os subjects do workspace
   */
  @Get('workspaces/:workspaceId/subjects')
  async findAll(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    const userId = session.user.id;
    return this.subjectService.findAll(
      userId,
      workspaceId,
      includeArchived === 'true',
    );
  }

  /**
   * POST /api/workspaces/:workspaceId/subjects
   * Cria um novo subject
   */
  @Post('workspaces/:workspaceId/subjects')
  async create(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateSubjectDto,
  ) {
    const userId = session.user.id;
    return this.subjectService.create(userId, workspaceId, dto);
  }

  /**
   * POST /api/workspaces/:workspaceId/subjects/find-or-create
   * Cria um subject se não existir, ou retorna o existente
   */
  @Post('workspaces/:workspaceId/subjects/find-or-create')
  async findOrCreate(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
    @Body('name') name: string,
  ) {
    const userId = session.user.id;
    return this.subjectService.findOrCreate(userId, workspaceId, name);
  }

  /**
   * PUT /api/workspaces/:workspaceId/subjects/reorder
   * Reordena os subjects do workspace
   */
  @Put('workspaces/:workspaceId/subjects/reorder')
  async reorder(
    @Session() session: UserSession,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: ReorderSubjectsDto,
  ) {
    const userId = session.user.id;
    return this.subjectService.reorder(userId, workspaceId, dto);
  }

  /**
   * GET /api/subjects/:id
   * Busca um subject por ID
   */
  @Get('subjects/:id')
  async findOne(
    @Session() session: UserSession,
    @Param('id') id: string,
  ) {
    const userId = session.user.id;
    return this.subjectService.findOne(userId, id);
  }

  /**
   * PUT /api/subjects/:id
   * Atualiza um subject
   */
  @Put('subjects/:id')
  async update(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: UpdateSubjectDto,
  ) {
    const userId = session.user.id;
    return this.subjectService.update(userId, id, dto);
  }

  /**
   * DELETE /api/subjects/:id
   * Arquiva um subject (soft delete)
   */
  @Delete('subjects/:id')
  async archive(
    @Session() session: UserSession,
    @Param('id') id: string,
  ) {
    const userId = session.user.id;
    return this.subjectService.archive(userId, id);
  }

  /**
   * POST /api/subjects/:id/unarchive
   * Desarquiva um subject
   */
  @Post('subjects/:id/unarchive')
  async unarchive(
    @Session() session: UserSession,
    @Param('id') id: string,
  ) {
    const userId = session.user.id;
    return this.subjectService.unarchive(userId, id);
  }

  /**
   * POST /api/subjects/merge
   * Mescla múltiplos subjects em um target
   */
  @Post('subjects/merge')
  async merge(
    @Session() session: UserSession,
    @Body() dto: MergeSubjectsDto,
  ) {
    const userId = session.user.id;
    return this.subjectService.merge(userId, dto);
  }
}
