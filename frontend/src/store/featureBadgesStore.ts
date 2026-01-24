/**
 * Feature Badges Store using Zustand
 * Tracks which new features users have seen to show/hide "Novo" badges
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FeatureKey = 'timer' | 'cycles' | 'dashboard';

interface FeatureBadgesState {
  seenFeatures: Record<FeatureKey, boolean>;
}

interface FeatureBadgesActions {
  markFeatureSeen: (feature: FeatureKey) => void;
  isFeatureNew: (feature: FeatureKey) => boolean;
  resetBadges: () => void;
}

type FeatureBadgesStore = FeatureBadgesState & FeatureBadgesActions;

const initialSeenFeatures: Record<FeatureKey, boolean> = {
  timer: false,
  cycles: false,
  dashboard: false,
};

export const useFeatureBadgesStore = create<FeatureBadgesStore>()(
  persist(
    (set, get) => ({
      seenFeatures: { ...initialSeenFeatures },

      markFeatureSeen: (feature: FeatureKey) =>
        set((state) => ({
          seenFeatures: {
            ...state.seenFeatures,
            [feature]: true,
          },
        })),

      isFeatureNew: (feature: FeatureKey) => !get().seenFeatures[feature],

      resetBadges: () => set({ seenFeatures: { ...initialSeenFeatures } }),
    }),
    {
      name: 'feature-badges-storage',
      partialize: (state) => ({ seenFeatures: state.seenFeatures }),
    }
  )
);

export default useFeatureBadgesStore;
