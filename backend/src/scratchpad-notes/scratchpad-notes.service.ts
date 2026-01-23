import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScratchpadNoteDto, UpdateScratchpadNoteDto } from './dto';

@Injectable()
export class ScratchpadNotesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all notes for a user
   */
  async findAll(userId: string) {
    return this.prisma.scratchpadNote.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Get a single note by ID
   */
  async findOne(userId: string, noteId: string) {
    const note = await this.prisma.scratchpadNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.userId !== userId) {
      throw new ForbiddenException('Not authorized to access this note');
    }

    return note;
  }

  /**
   * Create a new note
   */
  async create(userId: string, createDto: CreateScratchpadNoteDto) {
    return this.prisma.scratchpadNote.create({
      data: {
        userId,
        title: createDto.title,
        content: createDto.content,
      },
    });
  }

  /**
   * Update an existing note
   */
  async update(
    userId: string,
    noteId: string,
    updateDto: UpdateScratchpadNoteDto,
  ) {
    const note = await this.prisma.scratchpadNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.userId !== userId) {
      throw new ForbiddenException('Not authorized to update this note');
    }

    return this.prisma.scratchpadNote.update({
      where: { id: noteId },
      data: updateDto,
    });
  }

  /**
   * Delete a note
   */
  async delete(userId: string, noteId: string) {
    const note = await this.prisma.scratchpadNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.userId !== userId) {
      throw new ForbiddenException('Not authorized to delete this note');
    }

    await this.prisma.scratchpadNote.delete({
      where: { id: noteId },
    });

    return { success: true };
  }
}
