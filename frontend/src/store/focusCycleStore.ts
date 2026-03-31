/**
 * Focus Cycle Store using Zustand
 * Manages focus cycle state per workspace
 */
import { create } from 'zustand';
import type {
  FocusCycle,
  CycleSuggestion,
  CreateFocusCycleDto,
  UpdateFocusCycleDto,
} from '@/types/api';
import { focusCycleApi } from '@/lib/api';

interface FocusCycleState {
  cycle: FocusCycle | null;
  cycles: FocusCycle[];
  suggestion: CycleSuggestion | null;
  isLoading: boolean;
  error: string | null;
  currentWorkspaceId: string | null;
}

interface FocusCycleActions {
  /**
   * Fetch active cycle for a workspace
   */
  fetchCycle: (workspaceId: string) => Promise<void>;

  /**
   * Fetch all cycles for a workspace
   */
  fetchCycles: (workspaceId: string) => Promise<void>;

  /**
   * Activate a specific cycle
   */
  activateCycle: (workspaceId: string, cycleId: string) => Promise<void>;

  /**
   * Fetch current suggestion
   */
  fetchSuggestion: (workspaceId: string) => Promise<void>;

  /**
   * Create a new cycle
   */
  createCycle: (workspaceId: string, data: CreateFocusCycleDto) => Promise<FocusCycle>;

  /**
   * Update existing cycle
   */
  updateCycle: (workspaceId: string, data: UpdateFocusCycleDto) => Promise<FocusCycle>;

  /**
   * Advance to next item in cycle
   * @param forceComplete - If true, marks current task as complete
   */
  advanceToNext: (workspaceId: string, forceComplete?: boolean) => Promise<void>;

  /**
   * Delete cycle
   */
  deleteCycle: (workspaceId: string) => Promise<void>;

  /**
   * Reset cycle (zeroes progress, keeps sessions)
   */
  resetCycle: (workspaceId: string) => Promise<void>;

  /**
   * Clear cycle state
   */
  clearCycle: () => void;

  /**
   * Refresh both cycle and suggestion
   */
  refresh: (workspaceId: string) => Promise<void>;
}

type FocusCycleStore = FocusCycleState & FocusCycleActions;

export const useFocusCycleStore = create<FocusCycleStore>()((set, get) => ({
  cycle: null,
  cycles: [],
  suggestion: null,
  isLoading: false,
  error: null,
  currentWorkspaceId: null,

  fetchCycle: async (workspaceId: string) => {
    try {
      set({ isLoading: true, error: null, currentWorkspaceId: workspaceId });
      const cycle = await focusCycleApi.getCycle(workspaceId);
      set({ cycle, isLoading: false });
    } catch (error) {
      set({
        cycle: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch cycle',
      });
    }
  },

  fetchCycles: async (workspaceId: string) => {
    try {
      const cycles = await focusCycleApi.listCycles(workspaceId);
      set({ cycles });
    } catch (error) {
      set({
        cycles: [],
        error: error instanceof Error ? error.message : 'Failed to fetch cycles',
      });
    }
  },

  activateCycle: async (workspaceId: string, cycleId: string) => {
    try {
      set({ isLoading: true, error: null });
      const cycle = await focusCycleApi.activateCycle(workspaceId, cycleId);
      set({ cycle, isLoading: false });
      // Refresh cycles list and suggestion
      await get().fetchCycles(workspaceId);
      await get().fetchSuggestion(workspaceId);
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to activate cycle',
      });
      throw error;
    }
  },

  fetchSuggestion: async (workspaceId: string) => {
    try {
      const suggestion = await focusCycleApi.getSuggestion(workspaceId);
      set({ suggestion });
    } catch (error) {
      set({
        suggestion: null,
        error: error instanceof Error ? error.message : 'Failed to fetch suggestion',
      });
    }
  },

  createCycle: async (workspaceId: string, data: CreateFocusCycleDto) => {
    try {
      set({ isLoading: true, error: null });
      const cycle = await focusCycleApi.create(workspaceId, data);
      set({ cycle, isLoading: false });
      // Refresh suggestion after creating cycle
      await get().fetchSuggestion(workspaceId);
      return cycle;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create cycle',
      });
      throw error;
    }
  },

  updateCycle: async (workspaceId: string, data: UpdateFocusCycleDto) => {
    try {
      set({ isLoading: true, error: null });
      const cycle = await focusCycleApi.update(workspaceId, data);
      set({ cycle, isLoading: false });
      // Refresh suggestion after updating
      await get().fetchSuggestion(workspaceId);
      return cycle;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update cycle',
      });
      throw error;
    }
  },

  advanceToNext: async (workspaceId: string, forceComplete?: boolean) => {
    try {
      set({ isLoading: true, error: null });
      const cycle = await focusCycleApi.advance(workspaceId, forceComplete);
      set({ cycle, isLoading: false });
      // Refresh suggestion after advancing
      await get().fetchSuggestion(workspaceId);
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to advance cycle',
      });
      throw error;
    }
  },

  deleteCycle: async (workspaceId: string) => {
    try {
      set({ isLoading: true, error: null });
      await focusCycleApi.delete(workspaceId);
      set({ cycle: null, suggestion: null, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete cycle',
      });
      throw error;
    }
  },

  resetCycle: async (workspaceId: string) => {
    try {
      set({ isLoading: true, error: null });
      const cycle = await focusCycleApi.reset(workspaceId);
      set({ cycle, isLoading: false });
      // Refresh suggestion after resetting
      await get().fetchSuggestion(workspaceId);
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to reset cycle',
      });
      throw error;
    }
  },

  clearCycle: () => {
    set({
      cycle: null,
      cycles: [],
      suggestion: null,
      error: null,
      currentWorkspaceId: null,
    });
  },

  refresh: async (workspaceId: string) => {
    await Promise.all([
      get().fetchCycle(workspaceId),
      get().fetchCycles(workspaceId),
      get().fetchSuggestion(workspaceId),
    ]);
  },
}));

/**
 * Format minutes as hours and minutes string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}min`;
}

/**
 * Calculate progress percentage
 */
export function calculateCycleProgress(accumulated: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(100, (accumulated / target) * 100);
}

export default useFocusCycleStore;
