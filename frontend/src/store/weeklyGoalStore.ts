/**
 * Weekly Goal Store using Zustand
 * Caches weekly goals by weekStart date
 */
import { create } from 'zustand';
import type { WeeklyGoal, UpdateWeeklyGoalDto } from '@/types/api';
import { weeklyGoalsApi } from '@/lib/api';

interface WeeklyGoalState {
  // Map of weekStart (YYYY-MM-DD) to WeeklyGoal
  goals: Record<string, WeeklyGoal>;
  isLoading: boolean;
  error: string | null;
}

interface WeeklyGoalActions {
  /**
   * Get or create weekly goal for a specific week
   * Fetches from cache if available, otherwise from API
   */
  getGoalForWeek: (weekStart: string) => Promise<WeeklyGoal>;

  /**
   * Update weekly goal for a specific week
   * Throws if week is in the past
   */
  updateGoal: (weekStart: string, data: UpdateWeeklyGoalDto) => Promise<WeeklyGoal>;

  /**
   * Fetch goals for a date range and cache them
   */
  fetchGoalsForRange: (startDate: string, endDate: string) => Promise<void>;

  /**
   * Get goal from cache (sync)
   * Returns undefined if not cached
   */
  getCachedGoal: (weekStart: string) => WeeklyGoal | undefined;

  /**
   * Clear all cached goals
   */
  clearCache: () => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type WeeklyGoalStore = WeeklyGoalState & WeeklyGoalActions;

export const useWeeklyGoalStore = create<WeeklyGoalStore>()((set, get) => ({
  goals: {},
  isLoading: false,
  error: null,

  getGoalForWeek: async (weekStart: string) => {
    const cached = get().goals[weekStart];
    if (cached) {
      return cached;
    }

    try {
      set({ isLoading: true, error: null });
      const goal = await weeklyGoalsApi.getForWeek(weekStart);

      set((state) => ({
        goals: { ...state.goals, [weekStart]: goal },
        isLoading: false,
      }));

      return goal;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch goal',
      });
      throw error;
    }
  },

  updateGoal: async (weekStart: string, data: UpdateWeeklyGoalDto) => {
    try {
      set({ isLoading: true, error: null });
      const updatedGoal = await weeklyGoalsApi.update(weekStart, data);

      set((state) => ({
        goals: { ...state.goals, [weekStart]: updatedGoal },
        isLoading: false,
      }));

      return updatedGoal;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update goal',
      });
      throw error;
    }
  },

  fetchGoalsForRange: async (startDate: string, endDate: string) => {
    try {
      set({ isLoading: true, error: null });
      const goals = await weeklyGoalsApi.getForDateRange(startDate, endDate);

      const goalsMap = goals.reduce((acc, goal) => {
        // weekStart from API is ISO string, extract date part
        const weekStartKey = goal.weekStart.split('T')[0];
        acc[weekStartKey] = goal;
        return acc;
      }, {} as Record<string, WeeklyGoal>);

      set((state) => ({
        goals: { ...state.goals, ...goalsMap },
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch goals',
      });
      throw error;
    }
  },

  getCachedGoal: (weekStart: string) => {
    return get().goals[weekStart];
  },

  clearCache: () => {
    set({ goals: {} });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error });
  },
}));

/**
 * Calculate the week start date (Monday by default)
 */
export function calculateWeekStart(date: Date, weekStartDay: number = 1): string {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );

  const currentDay = d.getUTCDay(); // 0=Sun, 1=Mon, ...
  let diff = currentDay - weekStartDay;

  if (diff < 0) {
    diff += 7;
  }

  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().split('T')[0];
}

/**
 * Calculate weekly status based on total hours and goal
 */
export function calculateWeeklyStatus(
  totalMinutes: number,
  goal: WeeklyGoal,
): 'BLUE' | 'GREEN' | 'NONE' {
  const totalHours = totalMinutes / 60;

  if (totalHours >= goal.desHours) {
    return 'BLUE'; // Desired goal achieved
  }
  if (totalHours >= goal.minHours) {
    return 'GREEN'; // Minimum goal achieved
  }
  return 'NONE';
}

/**
 * Calculate progress percentage towards desired goal
 */
export function calculateProgress(totalMinutes: number, goal: WeeklyGoal): number {
  const totalHours = totalMinutes / 60;
  if (goal.desHours === 0) return 0;
  return Math.min(100, (totalHours / goal.desHours) * 100);
}

export default useWeeklyGoalStore;
