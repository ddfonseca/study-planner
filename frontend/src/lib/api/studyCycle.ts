/**
 * Study Cycle API client
 */
import { apiClient } from './client';
import type {
  StudyCycle,
  CycleSuggestion,
  CreateStudyCycleDto,
  UpdateStudyCycleDto,
} from '@/types/api';

export const studyCycleApi = {
  /**
   * Get cycle for a workspace
   */
  async getCycle(workspaceId: string): Promise<StudyCycle | null> {
    return apiClient.get<StudyCycle | null>(`/api/workspaces/${workspaceId}/cycle`);
  },

  /**
   * Get current study suggestion
   */
  async getSuggestion(workspaceId: string): Promise<CycleSuggestion> {
    return apiClient.get<CycleSuggestion>(`/api/workspaces/${workspaceId}/cycle/suggestion`);
  },

  /**
   * Create a new cycle (replaces existing)
   */
  async create(workspaceId: string, data: CreateStudyCycleDto): Promise<StudyCycle> {
    return apiClient.post<StudyCycle, CreateStudyCycleDto>(
      `/api/workspaces/${workspaceId}/cycle`,
      data
    );
  },

  /**
   * Update existing cycle
   */
  async update(workspaceId: string, data: UpdateStudyCycleDto): Promise<StudyCycle> {
    return apiClient.put<StudyCycle, UpdateStudyCycleDto>(
      `/api/workspaces/${workspaceId}/cycle`,
      data
    );
  },

  /**
   * Advance to next item in cycle
   */
  async advance(workspaceId: string): Promise<StudyCycle> {
    return apiClient.post<StudyCycle>(`/api/workspaces/${workspaceId}/cycle/advance`);
  },

  /**
   * Delete cycle
   */
  async delete(workspaceId: string): Promise<void> {
    return apiClient.delete<void>(`/api/workspaces/${workspaceId}/cycle`);
  },
};
