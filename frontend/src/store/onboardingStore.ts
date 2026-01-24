/**
 * Onboarding Store using Zustand
 * Tracks user onboarding state (e.g., welcome overlay)
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingState {
  hasSeenWelcome: boolean;
}

interface OnboardingActions {
  setHasSeenWelcome: (seen: boolean) => void;
  resetOnboarding: () => void;
}

type OnboardingStore = OnboardingState & OnboardingActions;

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      hasSeenWelcome: false,

      setHasSeenWelcome: (seen: boolean) => set({ hasSeenWelcome: seen }),

      resetOnboarding: () => set({ hasSeenWelcome: false }),
    }),
    {
      name: 'onboarding-storage',
      partialize: (state) => ({ hasSeenWelcome: state.hasSeenWelcome }),
    }
  )
);

export default useOnboardingStore;
