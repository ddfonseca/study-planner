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
import { ScratchpadNotesService } from './scratchpad-notes.service';
import { CreateScratchpadNoteDto, UpdateScratchpadNoteDto } from './dto';

@Controller('api/scratchpad-notes')
export class ScratchpadNotesController {
  constructor(private scratchpadNotesService: ScratchpadNotesService) {}

  /**
   * GET /api/scratchpad-notes
   * Get all notes for the current user
   */
  @Get()
  async getAll(@Session() session: UserSession) {
    const userId = session.user.id;
    return this.scratchpadNotesService.findAll(userId);
  }

  /**
   * GET /api/scratchpad-notes/:id
   * Get a single note by ID
   */
  @Get(':id')
  async getOne(@Session() session: UserSession, @Param('id') id: string) {
    const userId = session.user.id;
    return this.scratchpadNotesService.findOne(userId, id);
  }

  /**
   * POST /api/scratchpad-notes
   * Create a new note
   */
  @Post()
  async create(
    @Session() session: UserSession,
    @Body() createDto: CreateScratchpadNoteDto,
  ) {
    const userId = session.user.id;
    return this.scratchpadNotesService.create(userId, createDto);
  }

  /**
   * PUT /api/scratchpad-notes/:id
   * Update an existing note
   */
  @Put(':id')
  async update(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() updateDto: UpdateScratchpadNoteDto,
  ) {
    const userId = session.user.id;
    return this.scratchpadNotesService.update(userId, id, updateDto);
  }

  /**
   * DELETE /api/scratchpad-notes/:id
   * Delete a note
   */
  @Delete(':id')
  async delete(@Session() session: UserSession, @Param('id') id: string) {
    const userId = session.user.id;
    return this.scratchpadNotesService.delete(userId, id);
  }
}
