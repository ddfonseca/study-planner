/**
 * Focus Cycle API client
 */
import { apiClient } from './client';
import type {
  FocusCycle,
  CycleSuggestion,
  CycleStatistics,
  CycleHistory,
  CreateFocusCycleDto,
  UpdateFocusCycleDto,
} from '@/types/api';

export const focusCycleApi = {
  /**
   * Get active cycle for a workspace
   */
  async getCycle(workspaceId: string): Promise<FocusCycle | null> {
    return apiClient.get<FocusCycle | null>(`/api/workspaces/${workspaceId}/focus-cycle`);
  },

  /**
   * List all cycles for a workspace
   */
  async listCycles(workspaceId: string): Promise<FocusCycle[]> {
    return apiClient.get<FocusCycle[]>(`/api/workspaces/${workspaceId}/focus-cycle/list`);
  },

  /**
   * Activate a specific cycle
   */
  async activateCycle(workspaceId: string, cycleId: string): Promise<FocusCycle> {
    return apiClient.post<FocusCycle>(`/api/workspaces/${workspaceId}/focus-cycle/${cycleId}/activate`);
  },

  /**
   * Get current suggestion
   */
  async getSuggestion(workspaceId: string): Promise<CycleSuggestion> {
    return apiClient.get<CycleSuggestion>(`/api/workspaces/${workspaceId}/focus-cycle/suggestion`);
  },

  /**
   * Get cycle statistics
   */
  async getStatistics(workspaceId: string): Promise<CycleStatistics | null> {
    return apiClient.get<CycleStatistics | null>(`/api/workspaces/${workspaceId}/focus-cycle/statistics`);
  },

  /**
   * Get cycle history
   */
  async getHistory(workspaceId: string, limit = 20): Promise<CycleHistory | null> {
    return apiClient.get<CycleHistory | null>(`/api/workspaces/${workspaceId}/focus-cycle/history?limit=${limit}`);
  },

  /**
   * Create a new cycle (replaces existing)
   */
  async create(workspaceId: string, data: CreateFocusCycleDto): Promise<FocusCycle> {
    return apiClient.post<FocusCycle, CreateFocusCycleDto>(
      `/api/workspaces/${workspaceId}/focus-cycle`,
      data
    );
  },

  /**
   * Update existing cycle
   */
  async update(workspaceId: string, data: UpdateFocusCycleDto): Promise<FocusCycle> {
    return apiClient.put<FocusCycle, UpdateFocusCycleDto>(
      `/api/workspaces/${workspaceId}/focus-cycle`,
      data
    );
  },

  /**
   * Advance to next item in cycle
   * @param forceComplete - If true, marks current item as complete (adds compensation)
   */
  async advance(workspaceId: string, forceComplete?: boolean): Promise<FocusCycle> {
    return apiClient.post<FocusCycle, { forceComplete?: boolean }>(
      `/api/workspaces/${workspaceId}/focus-cycle/advance`,
      forceComplete ? { forceComplete } : undefined
    );
  },

  /**
   * Reset cycle (zeroes progress, keeps sessions)
   */
  async reset(workspaceId: string): Promise<FocusCycle> {
    return apiClient.post<FocusCycle>(`/api/workspaces/${workspaceId}/focus-cycle/reset`);
  },

  /**
   * Delete cycle
   */
  async delete(workspaceId: string): Promise<void> {
    return apiClient.delete<void>(`/api/workspaces/${workspaceId}/focus-cycle`);
  },
};
