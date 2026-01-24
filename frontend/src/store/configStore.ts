/**
 * User Configuration Store using Zustand
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UpdateConfigDto } from '@/types/api';
import { configApi } from '@/lib/api/config';

export type HeatmapStyle = 'gradient' | 'dots';

interface ConfigState {
  targetHours: number;
  weekStartDay: number; // 0=Dom, 1=Seg
  heatmapStyle: HeatmapStyle;
  celebrationsEnabled: boolean;
  isLoading: boolean;
  error: string | null;
}

interface ConfigActions {
  fetchConfig: () => Promise<void>;
  updateConfig: (config: UpdateConfigDto) => Promise<void>;
  setTargetHours: (hours: number) => void;
  setWeekStartDay: (day: number) => void;
  setHeatmapStyle: (style: HeatmapStyle) => void;
  setCelebrationsEnabled: (enabled: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type ConfigStore = ConfigState & ConfigActions;

// Default configuration values
const DEFAULT_TARGET_HOURS = 30;
const DEFAULT_WEEK_START_DAY = 1; // Segunda-feira
const DEFAULT_HEATMAP_STYLE: HeatmapStyle = 'gradient';
const DEFAULT_CELEBRATIONS_ENABLED = true;

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set) => ({
      // Initial state with defaults
      targetHours: DEFAULT_TARGET_HOURS,
      weekStartDay: DEFAULT_WEEK_START_DAY,
      heatmapStyle: DEFAULT_HEATMAP_STYLE,
      celebrationsEnabled: DEFAULT_CELEBRATIONS_ENABLED,
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
              weekStartDay: config.weekStartDay ?? DEFAULT_WEEK_START_DAY,
              isLoading: false,
            });
          } else {
            // Use defaults if no config exists
            set({
              targetHours: DEFAULT_TARGET_HOURS,
              weekStartDay: DEFAULT_WEEK_START_DAY,
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
            weekStartDay: updatedConfig.weekStartDay ?? DEFAULT_WEEK_START_DAY,
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

      setWeekStartDay: (day) => {
        set({ weekStartDay: day });
      },

      setHeatmapStyle: (style) => {
        set({ heatmapStyle: style });
      },

      setCelebrationsEnabled: (enabled) => {
        set({ celebrationsEnabled: enabled });
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
        weekStartDay: state.weekStartDay,
        heatmapStyle: state.heatmapStyle,
        celebrationsEnabled: state.celebrationsEnabled,
      }),
    }
  )
);

export default useConfigStore;
