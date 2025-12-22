/**
 * useWeeklyGoals Hook
 * Provides convenient access to weekly goals with automatic fetching
 */
import { useCallback } from 'react';
import {
  useWeeklyGoalStore,
  calculateWeekStart,
  isGoalAchieved,
  calculateProgress,
} from '@/store';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { WeeklyGoal, UpdateWeeklyGoalDto } from '@/types/api';
import type { Session } from '@/types/api';

interface UseWeeklyGoalsOptions {
  /**
   * Week start day (0=Sunday, 1=Monday, ..., 6=Saturday)
   * Default: 1 (Monday)
   */
  weekStartDay?: number;
}

interface WeekStatus {
  goal: WeeklyGoal | null;
  totalMinutes: number;
  totalHours: number;
  achieved: boolean;
  progress: number; // 0-100
  isLoading: boolean;
}

export function useWeeklyGoals(options: UseWeeklyGoalsOptions = {}) {
  const { weekStartDay = 1 } = options;
  const store = useWeeklyGoalStore();
  const { currentWorkspaceId } = useWorkspaceStore();

  // Whether goals can be edited (not in "all" mode)
  const canModifyGoals = currentWorkspaceId !== null;

  /**
   * Get goal for a specific week
   * Returns null if in "all" mode (consolidated view)
   */
  const getGoalForWeek = useCallback(
    async (date: Date): Promise<WeeklyGoal | null> => {
      if (!currentWorkspaceId) {
        return null; // Goals don't make sense in consolidated view
      }
      const weekStart = calculateWeekStart(date, weekStartDay);
      return store.getGoalForWeek(currentWorkspaceId, weekStart);
    },
    [weekStartDay, store, currentWorkspaceId],
  );

  /**
   * Get cached goal for a specific week (sync)
   */
  const getCachedGoalForWeek = useCallback(
    (date: Date): WeeklyGoal | undefined => {
      if (!currentWorkspaceId) {
        return undefined;
      }
      const weekStart = calculateWeekStart(date, weekStartDay);
      return store.getCachedGoal(currentWorkspaceId, weekStart);
    },
    [weekStartDay, store, currentWorkspaceId],
  );

  /**
   * Update goal for a specific week
   */
  const updateGoal = useCallback(
    async (date: Date, data: UpdateWeeklyGoalDto): Promise<WeeklyGoal> => {
      if (!currentWorkspaceId) {
        throw new Error('Selecione um workspace para editar a meta');
      }
      const weekStart = calculateWeekStart(date, weekStartDay);
      return store.updateGoal(currentWorkspaceId, weekStart, data);
    },
    [weekStartDay, store, currentWorkspaceId],
  );

  /**
   * Check if a week can be edited (current or future)
   */
  const canEditWeek = useCallback(
    (date: Date): boolean => {
      const now = new Date();
      const currentWeekStart = calculateWeekStart(now, weekStartDay);
      const targetWeekStart = calculateWeekStart(date, weekStartDay);
      return targetWeekStart >= currentWeekStart;
    },
    [weekStartDay],
  );

  /**
   * Calculate status for a week given sessions
   */
  const getWeekStatus = useCallback(
    (date: Date, sessions: Session[]): WeekStatus => {
      const weekStart = calculateWeekStart(date, weekStartDay);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      // Filter sessions for this week
      const weekSessions = sessions.filter((s) => {
        const sessionDate = new Date(s.date);
        return sessionDate >= new Date(weekStart) && sessionDate < weekEnd;
      });

      const totalMinutes = weekSessions.reduce((acc, s) => acc + s.minutes, 0);

      // In "all" mode, we don't have goals
      if (!currentWorkspaceId) {
        return {
          goal: null,
          totalMinutes,
          totalHours: totalMinutes / 60,
          achieved: false,
          progress: 0,
          isLoading: store.isLoading,
        };
      }

      const goal = store.getCachedGoal(currentWorkspaceId, weekStart);

      if (!goal) {
        return {
          goal: null,
          totalMinutes,
          totalHours: totalMinutes / 60,
          achieved: false,
          progress: 0,
          isLoading: store.isLoading,
        };
      }

      return {
        goal,
        totalMinutes,
        totalHours: totalMinutes / 60,
        achieved: isGoalAchieved(totalMinutes, goal),
        progress: calculateProgress(totalMinutes, goal),
        isLoading: store.isLoading,
      };
    },
    [weekStartDay, store, currentWorkspaceId],
  );

  /**
   * Prefetch goals for a date range
   */
  const prefetchGoals = useCallback(
    async (startDate: Date, endDate: Date): Promise<void> => {
      const start = calculateWeekStart(startDate, weekStartDay);
      const end = calculateWeekStart(endDate, weekStartDay);
      await store.fetchGoalsForRange(start, end, currentWorkspaceId || undefined);
    },
    [weekStartDay, store, currentWorkspaceId],
  );

  return {
    // State
    goals: store.goals,
    isLoading: store.isLoading,
    error: store.error,
    currentWorkspaceId,
    canModifyGoals,

    // Actions
    getGoalForWeek,
    getCachedGoalForWeek,
    updateGoal,
    prefetchGoals,

    // Helpers
    canEditWeek,
    getWeekStatus,
    calculateWeekStart: (date: Date) => calculateWeekStart(date, weekStartDay),
  };
}

export default useWeeklyGoals;
