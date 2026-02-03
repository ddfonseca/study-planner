/**
 * Disciplines API
 */
import { apiClient } from './client';
import type {
  Discipline,
  CreateDisciplineDto,
  UpdateDisciplineDto,
} from '@/types/api';

export const disciplinesApi = {
  /**
   * Get all disciplines for a workspace
   */
  async getAll(workspaceId: string): Promise<Discipline[]> {
    return apiClient.get<Discipline[]>(`/api/workspaces/${workspaceId}/disciplines`);
  },

  /**
   * Get a single discipline by ID
   */
  async getOne(disciplineId: string): Promise<Discipline> {
    return apiClient.get<Discipline>(`/api/disciplines/${disciplineId}`);
  },

  /**
   * Create a new discipline
   */
  async create(workspaceId: string, data: CreateDisciplineDto): Promise<Discipline> {
    return apiClient.post<Discipline, CreateDisciplineDto>(
      `/api/workspaces/${workspaceId}/disciplines`,
      data,
    );
  },

  /**
   * Update a discipline
   */
  async update(disciplineId: string, data: UpdateDisciplineDto): Promise<Discipline> {
    return apiClient.put<Discipline, UpdateDisciplineDto>(
      `/api/disciplines/${disciplineId}`,
      data,
    );
  },

  /**
   * Add subjects to a discipline
   */
  async addSubjects(disciplineId: string, subjectIds: string[]): Promise<Discipline> {
    return apiClient.post<Discipline, { subjectIds: string[] }>(
      `/api/disciplines/${disciplineId}/subjects`,
      { subjectIds },
    );
  },

  /**
   * Remove subjects from a discipline
   */
  async removeSubjects(disciplineId: string, subjectIds: string[]): Promise<Discipline> {
    return apiClient.delete<Discipline>(`/api/disciplines/${disciplineId}/subjects`, {
      subjectIds,
    });
  },

  /**
   * Reorder disciplines
   */
  async reorder(workspaceId: string, orderedIds: string[]): Promise<Discipline[]> {
    return apiClient.put<Discipline[], { orderedIds: string[] }>(
      `/api/workspaces/${workspaceId}/disciplines/reorder`,
      { orderedIds },
    );
  },

  /**
   * Delete a discipline
   */
  async delete(disciplineId: string): Promise<void> {
    return apiClient.delete<void>(`/api/disciplines/${disciplineId}`);
  },
};

export default disciplinesApi;
