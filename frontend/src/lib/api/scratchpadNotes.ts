/**
 * Scratchpad Notes API
 */
import { apiClient } from './client';

export interface ScratchpadNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScratchpadNoteDto {
  title: string;
  content: string;
}

export interface UpdateScratchpadNoteDto {
  title?: string;
  content?: string;
}

export const scratchpadNotesApi = {
  /**
   * Get all notes for the current user
   */
  async getAll(): Promise<ScratchpadNote[]> {
    return apiClient.get<ScratchpadNote[]>('/api/scratchpad-notes');
  },

  /**
   * Get a single note by ID
   */
  async getById(id: string): Promise<ScratchpadNote> {
    return apiClient.get<ScratchpadNote>(`/api/scratchpad-notes/${id}`);
  },

  /**
   * Create a new note
   */
  async create(data: CreateScratchpadNoteDto): Promise<ScratchpadNote> {
    return apiClient.post<ScratchpadNote, CreateScratchpadNoteDto>(
      '/api/scratchpad-notes',
      data
    );
  },

  /**
   * Update an existing note
   */
  async update(id: string, data: UpdateScratchpadNoteDto): Promise<ScratchpadNote> {
    return apiClient.put<ScratchpadNote, UpdateScratchpadNoteDto>(
      `/api/scratchpad-notes/${id}`,
      data
    );
  },

  /**
   * Delete a note
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/scratchpad-notes/${id}`);
  },
};

export default scratchpadNotesApi;
