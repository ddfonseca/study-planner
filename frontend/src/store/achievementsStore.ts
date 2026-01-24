/**
 * Achievements Store using Zustand
 * Tracks which achievements have been shown to prevent duplicate celebrations
 * Persists to localStorage so achievements aren't repeated on page refresh
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AchievementType = 'weekly_goal' | 'cycle_complete';

interface AchievementsState {
  /**
   * Shown achievements stored as a Set-like object
   * Keys are in format: "{type}:{identifier}"
   * - weekly_goal:2024-01-15 (week start date)
   * - cycle_complete:{cycleId}:{resetCount}
   */
  shownAchievements: Record<string, boolean>;
  _hasHydrated: boolean;
}

interface AchievementsActions {
  /**
   * Mark an achievement as shown
   * @param type - The type of achievement
   * @param identifier - Unique identifier (week start for weekly goal, cycleId:resetCount for cycles)
   */
  markAchievementShown: (type: AchievementType, identifier: string) => void;

  /**
   * Check if an achievement has already been shown
   * @param type - The type of achievement
   * @param identifier - Unique identifier
   */
  hasAchievementBeenShown: (type: AchievementType, identifier: string) => boolean;

  /**
   * Clear old achievements (e.g., achievements older than 90 days)
   * Called automatically on hydration
   */
  cleanupOldAchievements: () => void;

  /**
   * Reset all achievements (for testing/debugging)
   */
  resetAchievements: () => void;

  setHasHydrated: (state: boolean) => void;
}

type AchievementsStore = AchievementsState & AchievementsActions;

const ACHIEVEMENT_KEY_SEPARATOR = ':';
const MAX_AGE_DAYS = 90;

/**
 * Build a unique key for an achievement
 */
function buildKey(type: AchievementType, identifier: string): string {
  return `${type}${ACHIEVEMENT_KEY_SEPARATOR}${identifier}`;
}

/**
 * Parse a key to extract type and identifier
 */
function parseKey(key: string): { type: AchievementType; identifier: string } | null {
  const separatorIndex = key.indexOf(ACHIEVEMENT_KEY_SEPARATOR);
  if (separatorIndex === -1) return null;

  const type = key.substring(0, separatorIndex) as AchievementType;
  const identifier = key.substring(separatorIndex + 1);

  return { type, identifier };
}

/**
 * Check if a weekly goal achievement is too old
 */
function isWeeklyGoalTooOld(identifier: string): boolean {
  const weekStart = new Date(identifier);
  if (isNaN(weekStart.getTime())) return false;

  const now = new Date();
  const diffDays = Math.floor((now.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays > MAX_AGE_DAYS;
}

export const useAchievementsStore = create<AchievementsStore>()(
  persist(
    (set, get) => ({
      shownAchievements: {},
      _hasHydrated: false,

      markAchievementShown: (type: AchievementType, identifier: string) => {
        if (!get()._hasHydrated) {
          return;
        }

        const key = buildKey(type, identifier);
        set((state) => ({
          shownAchievements: {
            ...state.shownAchievements,
            [key]: true,
          },
        }));
      },

      hasAchievementBeenShown: (type: AchievementType, identifier: string) => {
        if (!get()._hasHydrated) {
          return true; // Return true before hydration to prevent showing achievements
        }

        const key = buildKey(type, identifier);
        return Boolean(get().shownAchievements[key]);
      },

      cleanupOldAchievements: () => {
        const state = get();
        const cleaned: Record<string, boolean> = {};

        for (const key of Object.keys(state.shownAchievements)) {
          const parsed = parseKey(key);
          if (!parsed) continue;

          // Only cleanup weekly goal achievements based on age
          if (parsed.type === 'weekly_goal' && isWeeklyGoalTooOld(parsed.identifier)) {
            continue; // Skip (don't include in cleaned)
          }

          // Keep all cycle_complete achievements and recent weekly_goal achievements
          cleaned[key] = true;
        }

        if (Object.keys(cleaned).length !== Object.keys(state.shownAchievements).length) {
          set({ shownAchievements: cleaned });
        }
      },

      resetAchievements: () => set({ shownAchievements: {} }),

      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
    }),
    {
      name: 'achievements-storage',
      partialize: (state) => ({ shownAchievements: state.shownAchievements }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
          // Clean up old achievements after hydration
          state.cleanupOldAchievements();
        }
      },
    }
  )
);

export default useAchievementsStore;
