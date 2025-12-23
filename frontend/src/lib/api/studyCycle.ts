/**
 * Study Cycle API client
 */
import { apiClient } from './client';
import type {
  StudyCycle,
  CycleSuggestion,
  CycleStatistics,
  CycleHistory,
  CreateStudyCycleDto,
  UpdateStudyCycleDto,
} from '@/types/api';

export const studyCycleApi = {
  /**
   * Get active cycle for a workspace
   */
  async getCycle(workspaceId: string): Promise<StudyCycle | null> {
    return apiClient.get<StudyCycle | null>(`/api/workspaces/${workspaceId}/cycle`);
  },

  /**
   * List all cycles for a workspace
   */
  async listCycles(workspaceId: string): Promise<StudyCycle[]> {
    return apiClient.get<StudyCycle[]>(`/api/workspaces/${workspaceId}/cycle/list`);
  },

  /**
   * Activate a specific cycle
   */
  async activateCycle(workspaceId: string, cycleId: string): Promise<StudyCycle> {
    return apiClient.post<StudyCycle>(`/api/workspaces/${workspaceId}/cycle/${cycleId}/activate`);
  },

  /**
   * Get current study suggestion
   */
  async getSuggestion(workspaceId: string): Promise<CycleSuggestion> {
    return apiClient.get<CycleSuggestion>(`/api/workspaces/${workspaceId}/cycle/suggestion`);
  },

  /**
   * Get cycle statistics
   */
  async getStatistics(workspaceId: string): Promise<CycleStatistics | null> {
    return apiClient.get<CycleStatistics | null>(`/api/workspaces/${workspaceId}/cycle/statistics`);
  },

  /**
   * Get cycle history
   */
  async getHistory(workspaceId: string, limit = 20): Promise<CycleHistory | null> {
    return apiClient.get<CycleHistory | null>(`/api/workspaces/${workspaceId}/cycle/history?limit=${limit}`);
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
   * Reset cycle (zeroes progress, keeps sessions)
   */
  async reset(workspaceId: string): Promise<StudyCycle> {
    return apiClient.post<StudyCycle>(`/api/workspaces/${workspaceId}/cycle/reset`);
  },

  /**
   * Delete cycle
   */
  async delete(workspaceId: string): Promise<void> {
    return apiClient.delete<void>(`/api/workspaces/${workspaceId}/cycle`);
  },
};
