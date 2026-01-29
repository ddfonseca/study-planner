/**
 * Weekly Goal Store using Zustand
 * Caches weekly goals by workspaceId and weekStart date
 */
import { create } from 'zustand';
import type { WeeklyGoal, UpdateWeeklyGoalDto } from '@/types/api';
import { weeklyGoalsApi } from '@/lib/api';

// Cache key format: workspaceId:weekStart
function getCacheKey(workspaceId: string, weekStart: string): string {
  return `${workspaceId}:${weekStart}`;
}

interface WeeklyGoalState {
  // Map of workspaceId:weekStart to WeeklyGoal
  goals: Record<string, WeeklyGoal>;
  isLoading: boolean;
  error: string | null;
  // Track pending fetches to prevent duplicates
  _pendingFetches: Record<string, Promise<void>>;
}

interface WeeklyGoalActions {
  /**
   * Get or create weekly goal for a specific week and workspace
   * Fetches from cache if available, otherwise from API
   */
  getGoalForWeek: (workspaceId: string, weekStart: string) => Promise<WeeklyGoal>;

  /**
   * Update weekly goal for a specific week and workspace
   */
  updateGoal: (workspaceId: string, weekStart: string, data: UpdateWeeklyGoalDto) => Promise<WeeklyGoal>;

  /**
   * Fetch goals for a date range and cache them
   */
  fetchGoalsForRange: (startDate: string, endDate: string, workspaceId?: string) => Promise<void>;

  /**
   * Get goal from cache (sync)
   * Returns undefined if not cached
   */
  getCachedGoal: (workspaceId: string, weekStart: string) => WeeklyGoal | undefined;

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
  _pendingFetches: {},

  getGoalForWeek: async (workspaceId: string, weekStart: string) => {
    const cacheKey = getCacheKey(workspaceId, weekStart);
    const cached = get().goals[cacheKey];
    if (cached) {
      return cached;
    }

    try {
      set({ isLoading: true, error: null });
      const goal = await weeklyGoalsApi.getForWeek(workspaceId, weekStart);

      set((state) => ({
        goals: { ...state.goals, [cacheKey]: goal },
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

  updateGoal: async (workspaceId: string, weekStart: string, data: UpdateWeeklyGoalDto) => {
    const cacheKey = getCacheKey(workspaceId, weekStart);
    try {
      set({ isLoading: true, error: null });
      const updatedGoal = await weeklyGoalsApi.update(workspaceId, weekStart, data);

      set((state) => ({
        goals: { ...state.goals, [cacheKey]: updatedGoal },
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

  fetchGoalsForRange: async (startDate: string, endDate: string, workspaceId?: string) => {
    const fetchKey = `${workspaceId || 'all'}:${startDate}-${endDate}`;

    // Return existing promise if fetch is already in progress
    const pending = get()._pendingFetches[fetchKey];
    if (pending) {
      return pending;
    }

    const fetchPromise = (async () => {
      try {
        set({ isLoading: true, error: null });
        const goals = await weeklyGoalsApi.getForDateRange(startDate, endDate, workspaceId);

        const goalsMap = goals.reduce((acc, goal) => {
          // weekStart from API is ISO string, extract date part
          const weekStartKey = goal.weekStart.split('T')[0];
          const cacheKey = getCacheKey(goal.workspaceId, weekStartKey);
          acc[cacheKey] = goal;
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
      } finally {
        // Clean up pending fetch
        set((state) => {
          const rest = { ...state._pendingFetches };
          delete rest[fetchKey];
          return { _pendingFetches: rest };
        });
      }
    })();

    // Track the pending fetch
    set((state) => ({
      _pendingFetches: { ...state._pendingFetches, [fetchKey]: fetchPromise },
    }));

    return fetchPromise;
  },

  getCachedGoal: (workspaceId: string, weekStart: string) => {
    const cacheKey = getCacheKey(workspaceId, weekStart);
    return get().goals[cacheKey];
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
 * Uses local timezone to ensure consistency with session dates
 */
export function calculateWeekStart(date: Date, weekStartDay: number = 1): string {
  // Create a new date at midnight local time
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const currentDay = d.getDay(); // 0=Sun, 1=Mon, ... (local)
  let diff = currentDay - weekStartDay;

  if (diff < 0) {
    diff += 7;
  }

  d.setDate(d.getDate() - diff);

  // Format as YYYY-MM-DD using local timezone
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if weekly goal is achieved
 */
export function isGoalAchieved(totalMinutes: number, goal: WeeklyGoal): boolean {
  const totalHours = totalMinutes / 60;
  return totalHours >= goal.targetHours;
}

/**
 * Calculate progress percentage towards target goal
 */
export function calculateProgress(totalMinutes: number, goal: WeeklyGoal): number {
  const totalHours = totalMinutes / 60;
  if (goal.targetHours === 0) return 0;
  return Math.min(100, (totalHours / goal.targetHours) * 100);
}

export default useWeeklyGoalStore;
