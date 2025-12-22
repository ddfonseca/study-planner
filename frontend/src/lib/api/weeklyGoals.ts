/**
 * Weekly Goals API
 */
import { apiClient } from './client';
import type { WeeklyGoal, UpdateWeeklyGoalDto } from '@/types/api';

export const weeklyGoalsApi = {
  /**
   * Get weekly goal for a specific week and workspace
   * Creates with defaults if not exists
   * @param workspaceId - Workspace ID (required)
   * @param weekStart - Date string in YYYY-MM-DD format
   */
  async getForWeek(workspaceId: string, weekStart: string): Promise<WeeklyGoal> {
    const params = new URLSearchParams();
    params.append('workspaceId', workspaceId);
    return apiClient.get<WeeklyGoal>(`/api/weekly-goals/${weekStart}?${params.toString()}`);
  },

  /**
   * Update weekly goal for a specific week and workspace
   * @param workspaceId - Workspace ID (required)
   * @param weekStart - Date string in YYYY-MM-DD format
   * @param data - Updated goal values
   */
  async update(
    workspaceId: string,
    weekStart: string,
    data: UpdateWeeklyGoalDto,
  ): Promise<WeeklyGoal> {
    const params = new URLSearchParams();
    params.append('workspaceId', workspaceId);
    return apiClient.put<WeeklyGoal, UpdateWeeklyGoalDto>(
      `/api/weekly-goals/${weekStart}?${params.toString()}`,
      data,
    );
  },

  /**
   * Get all weekly goals within a date range
   * @param workspaceId - Workspace ID or "all" for all workspaces (optional)
   */
  async getForDateRange(
    startDate: string,
    endDate: string,
    workspaceId?: string,
  ): Promise<WeeklyGoal[]> {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    if (workspaceId) params.append('workspaceId', workspaceId);
    return apiClient.get<WeeklyGoal[]>(`/api/weekly-goals?${params.toString()}`);
  },
};

export default weeklyGoalsApi;
