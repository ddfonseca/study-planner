/**
 * Onboarding Store using Zustand
 * Tracks user onboarding state (e.g., welcome overlay)
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingState {
  hasSeenWelcome: boolean;
  shouldOpenSessionModal: boolean;
}

interface OnboardingActions {
  setHasSeenWelcome: (seen: boolean) => void;
  setShouldOpenSessionModal: (shouldOpen: boolean) => void;
  resetOnboarding: () => void;
}

type OnboardingStore = OnboardingState & OnboardingActions;

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      hasSeenWelcome: false,
      shouldOpenSessionModal: false,

      setHasSeenWelcome: (seen: boolean) => set({ hasSeenWelcome: seen }),

      setShouldOpenSessionModal: (shouldOpen: boolean) => set({ shouldOpenSessionModal: shouldOpen }),

      resetOnboarding: () => set({ hasSeenWelcome: false, shouldOpenSessionModal: false }),
    }),
    {
      name: 'onboarding-storage',
      partialize: (state) => ({ hasSeenWelcome: state.hasSeenWelcome }),
    }
  )
);

export default useOnboardingStore;
