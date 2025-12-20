/**
 * User Configuration Store using Zustand
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UpdateConfigDto } from '@/types/api';
import { configApi } from '@/lib/api/config';

interface ConfigState {
  targetHours: number;
  isLoading: boolean;
  error: string | null;
}

interface ConfigActions {
  fetchConfig: () => Promise<void>;
  updateConfig: (config: UpdateConfigDto) => Promise<void>;
  setTargetHours: (hours: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type ConfigStore = ConfigState & ConfigActions;

// Default configuration values
const DEFAULT_TARGET_HOURS = 30;

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set) => ({
      // Initial state with defaults
      targetHours: DEFAULT_TARGET_HOURS,
      isLoading: false,
      error: null,

      // Actions
      fetchConfig: async () => {
        try {
          set({ isLoading: true, error: null });
          const config = await configApi.get();

          if (config) {
            set({
              targetHours: config.targetHours,
              isLoading: false,
            });
          } else {
            // Use defaults if no config exists
            set({
              targetHours: DEFAULT_TARGET_HOURS,
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch config',
          });
        }
      },

      updateConfig: async (config) => {
        try {
          set({ isLoading: true, error: null });
          const updatedConfig = await configApi.update(config);

          set({
            targetHours: updatedConfig.targetHours,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to update config',
          });
          throw error;
        }
      },

      setTargetHours: (hours) => {
        set({ targetHours: hours });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error });
      },
    }),
    {
      name: 'config-storage',
      partialize: (state) => ({
        targetHours: state.targetHours,
      }),
    }
  )
);

export default useConfigStore;
