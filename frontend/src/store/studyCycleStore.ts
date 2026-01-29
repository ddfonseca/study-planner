/**
 * Study Cycle Store using Zustand
 * Manages study cycle state per workspace
 */
import { create } from 'zustand';
import type {
  StudyCycle,
  CycleSuggestion,
  CreateStudyCycleDto,
  UpdateStudyCycleDto,
} from '@/types/api';
import { studyCycleApi } from '@/lib/api';

interface StudyCycleState {
  cycle: StudyCycle | null;
  cycles: StudyCycle[];
  suggestion: CycleSuggestion | null;
  isLoading: boolean;
  error: string | null;
  currentWorkspaceId: string | null;
}

interface StudyCycleActions {
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
   * Fetch current study suggestion
   */
  fetchSuggestion: (workspaceId: string) => Promise<void>;

  /**
   * Create a new cycle
   */
  createCycle: (workspaceId: string, data: CreateStudyCycleDto) => Promise<StudyCycle>;

  /**
   * Update existing cycle
   */
  updateCycle: (workspaceId: string, data: UpdateStudyCycleDto) => Promise<StudyCycle>;

  /**
   * Advance to next item in cycle
   * @param forceComplete - If true, marks current subject as complete
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

type StudyCycleStore = StudyCycleState & StudyCycleActions;

export const useStudyCycleStore = create<StudyCycleStore>()((set, get) => ({
  cycle: null,
  cycles: [],
  suggestion: null,
  isLoading: false,
  error: null,
  currentWorkspaceId: null,

  fetchCycle: async (workspaceId: string) => {
    try {
      set({ isLoading: true, error: null, currentWorkspaceId: workspaceId });
      const cycle = await studyCycleApi.getCycle(workspaceId);
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
      const cycles = await studyCycleApi.listCycles(workspaceId);
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
      const cycle = await studyCycleApi.activateCycle(workspaceId, cycleId);
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
      const suggestion = await studyCycleApi.getSuggestion(workspaceId);
      set({ suggestion });
    } catch (error) {
      set({
        suggestion: null,
        error: error instanceof Error ? error.message : 'Failed to fetch suggestion',
      });
    }
  },

  createCycle: async (workspaceId: string, data: CreateStudyCycleDto) => {
    try {
      set({ isLoading: true, error: null });
      const cycle = await studyCycleApi.create(workspaceId, data);
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

  updateCycle: async (workspaceId: string, data: UpdateStudyCycleDto) => {
    try {
      set({ isLoading: true, error: null });
      const cycle = await studyCycleApi.update(workspaceId, data);
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
      const cycle = await studyCycleApi.advance(workspaceId, forceComplete);
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
      await studyCycleApi.delete(workspaceId);
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
      const cycle = await studyCycleApi.reset(workspaceId);
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

export default useStudyCycleStore;
