/**
 * User Configuration Store using Zustand
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UpdateConfigDto } from '@/types/api';
import type { Config } from '@/types/session';
import { configApi } from '@/lib/api/config';

interface ConfigState extends Config {
  isLoading: boolean;
  error: string | null;
}

interface ConfigActions {
  fetchConfig: () => Promise<void>;
  updateConfig: (config: UpdateConfigDto) => Promise<void>;
  setMinHours: (hours: number) => void;
  setDesHours: (hours: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type ConfigStore = ConfigState & ConfigActions;

// Default configuration values
const DEFAULT_MIN_HOURS = 2;
const DEFAULT_DES_HOURS = 4;

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set) => ({
      // Initial state with defaults
      minHours: DEFAULT_MIN_HOURS,
      desHours: DEFAULT_DES_HOURS,
      isLoading: false,
      error: null,

      // Actions
      fetchConfig: async () => {
        try {
          set({ isLoading: true, error: null });
          const config = await configApi.get();

          if (config) {
            set({
              minHours: config.minHours,
              desHours: config.desHours,
              isLoading: false,
            });
          } else {
            // Use defaults if no config exists
            set({
              minHours: DEFAULT_MIN_HOURS,
              desHours: DEFAULT_DES_HOURS,
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
            minHours: updatedConfig.minHours,
            desHours: updatedConfig.desHours,
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

      setMinHours: (hours) => {
        set({ minHours: hours });
      },

      setDesHours: (hours) => {
        set({ desHours: hours });
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
        minHours: state.minHours,
        desHours: state.desHours,
      }),
    }
  )
);

export default useConfigStore;
