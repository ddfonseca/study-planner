/**
 * Feature Badges Store using Zustand
 * Tracks which new features users have seen to show/hide "Novo" badges
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FeatureKey = 'timer' | 'cycles' | 'dashboard' | 'allocation' | 'subjects';

interface FeatureBadgesState {
  seenFeatures: Record<FeatureKey, boolean>;
  _hasHydrated: boolean;
}

interface FeatureBadgesActions {
  markFeatureSeen: (feature: FeatureKey) => void;
  isFeatureNew: (feature: FeatureKey) => boolean;
  resetBadges: () => void;
  setHasHydrated: (state: boolean) => void;
}

type FeatureBadgesStore = FeatureBadgesState & FeatureBadgesActions;

const initialSeenFeatures: Record<FeatureKey, boolean> = {
  timer: false,
  cycles: false,
  dashboard: false,
  allocation: false,
  subjects: false,
};

export const useFeatureBadgesStore = create<FeatureBadgesStore>()(
  persist(
    (set, get) => ({
      seenFeatures: { ...initialSeenFeatures },
      _hasHydrated: false,

      markFeatureSeen: (feature: FeatureKey) => {
        // Only allow marking features as seen after hydration is complete
        // This prevents race conditions where features get marked before
        // the persisted state is loaded from localStorage
        if (!get()._hasHydrated) {
          return;
        }
        set((state) => ({
          seenFeatures: {
            ...state.seenFeatures,
            [feature]: true,
          },
        }));
      },

      isFeatureNew: (feature: FeatureKey) => {
        // Before hydration, return false to hide badges and prevent
        // accidental marking of features as seen
        if (!get()._hasHydrated) {
          return false;
        }
        return !get().seenFeatures[feature];
      },

      resetBadges: () => set({ seenFeatures: { ...initialSeenFeatures } }),

      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
    }),
    {
      name: 'feature-badges-storage',
      partialize: (state) => ({ seenFeatures: state.seenFeatures }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export default useFeatureBadgesStore;
