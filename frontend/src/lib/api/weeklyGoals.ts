/**
 * Weekly Goals API
 */
import { apiClient } from './client';
import type { WeeklyGoal, UpdateWeeklyGoalDto } from '@/types/api';

export const weeklyGoalsApi = {
  /**
   * Get weekly goal for a specific week
   * Creates with defaults if not exists
   * @param weekStart - Date string in YYYY-MM-DD format
   */
  async getForWeek(weekStart: string): Promise<WeeklyGoal> {
    return apiClient.get<WeeklyGoal>(`/api/weekly-goals/${weekStart}`);
  },

  /**
   * Update weekly goal for a specific week
   * @param weekStart - Date string in YYYY-MM-DD format
   * @param data - Updated goal values
   */
  async update(weekStart: string, data: UpdateWeeklyGoalDto): Promise<WeeklyGoal> {
    return apiClient.put<WeeklyGoal, UpdateWeeklyGoalDto>(
      `/api/weekly-goals/${weekStart}`,
      data,
    );
  },

  /**
   * Get all weekly goals within a date range
   */
  async getForDateRange(startDate: string, endDate: string): Promise<WeeklyGoal[]> {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    return apiClient.get<WeeklyGoal[]>(`/api/weekly-goals?${params.toString()}`);
  },
};

export default weeklyGoalsApi;
