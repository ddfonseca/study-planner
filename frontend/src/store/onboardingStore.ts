/**
 * Onboarding Store using Zustand
 * Tracks user onboarding state (e.g., welcome overlay)
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingState {
  hasSeenWelcome: boolean;
  hasCompletedTour: boolean;
  shouldOpenSessionModal: boolean;
  shouldStartTour: boolean;
}

interface OnboardingActions {
  setHasSeenWelcome: (seen: boolean) => void;
  setHasCompletedTour: (completed: boolean) => void;
  setShouldOpenSessionModal: (shouldOpen: boolean) => void;
  setShouldStartTour: (shouldStart: boolean) => void;
  resetOnboarding: () => void;
}

type OnboardingStore = OnboardingState & OnboardingActions;

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      hasSeenWelcome: false,
      hasCompletedTour: false,
      shouldOpenSessionModal: false,
      shouldStartTour: false,

      setHasSeenWelcome: (seen: boolean) => set({ hasSeenWelcome: seen }),

      setHasCompletedTour: (completed: boolean) => set({ hasCompletedTour: completed }),

      setShouldOpenSessionModal: (shouldOpen: boolean) => set({ shouldOpenSessionModal: shouldOpen }),

      setShouldStartTour: (shouldStart: boolean) => set({ shouldStartTour: shouldStart }),

      resetOnboarding: () => set({
        hasSeenWelcome: false,
        hasCompletedTour: false,
        shouldOpenSessionModal: false,
        shouldStartTour: false,
      }),
    }),
    {
      name: 'onboarding-storage',
      partialize: (state) => ({
        hasSeenWelcome: state.hasSeenWelcome,
        hasCompletedTour: state.hasCompletedTour,
      }),
    }
  )
);

export default useOnboardingStore;
