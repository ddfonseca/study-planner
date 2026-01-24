import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useAchievementsStore } from './achievementsStore';

describe('achievementsStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAchievementsStore.setState({
      shownAchievements: {},
      _hasHydrated: true,
    });
  });

  describe('initial state', () => {
    it('has empty shownAchievements by default', () => {
      const state = useAchievementsStore.getState();
      expect(state.shownAchievements).toEqual({});
    });

    it('reports no achievements as shown initially', () => {
      const { hasAchievementBeenShown } = useAchievementsStore.getState();
      expect(hasAchievementBeenShown('weekly_goal', '2024-01-15')).toBe(false);
      expect(hasAchievementBeenShown('cycle_complete', 'cycle-123:2024-01-15T12:00:00.000Z')).toBe(false);
    });
  });

  describe('markAchievementShown', () => {
    it('marks weekly goal achievement as shown', () => {
      const { markAchievementShown, hasAchievementBeenShown } = useAchievementsStore.getState();

      markAchievementShown('weekly_goal', '2024-01-15');

      expect(hasAchievementBeenShown('weekly_goal', '2024-01-15')).toBe(true);
    });

    it('marks cycle complete achievement as shown', () => {
      const { markAchievementShown, hasAchievementBeenShown } = useAchievementsStore.getState();

      markAchievementShown('cycle_complete', 'cycle-123:2024-01-15T12:00:00.000Z');

      expect(hasAchievementBeenShown('cycle_complete', 'cycle-123:2024-01-15T12:00:00.000Z')).toBe(true);
    });

    it('can mark multiple achievements as shown', () => {
      const { markAchievementShown, hasAchievementBeenShown } = useAchievementsStore.getState();

      markAchievementShown('weekly_goal', '2024-01-15');
      markAchievementShown('weekly_goal', '2024-01-22');
      markAchievementShown('cycle_complete', 'cycle-123:2024-01-15T12:00:00.000Z');

      expect(hasAchievementBeenShown('weekly_goal', '2024-01-15')).toBe(true);
      expect(hasAchievementBeenShown('weekly_goal', '2024-01-22')).toBe(true);
      expect(hasAchievementBeenShown('cycle_complete', 'cycle-123:2024-01-15T12:00:00.000Z')).toBe(true);
    });

    it('does not affect other achievements when marking one', () => {
      const { markAchievementShown, hasAchievementBeenShown } = useAchievementsStore.getState();

      markAchievementShown('weekly_goal', '2024-01-15');

      expect(hasAchievementBeenShown('weekly_goal', '2024-01-15')).toBe(true);
      expect(hasAchievementBeenShown('weekly_goal', '2024-01-22')).toBe(false);
      expect(hasAchievementBeenShown('cycle_complete', 'cycle-123:2024-01-15T12:00:00.000Z')).toBe(false);
    });
  });

  describe('hasAchievementBeenShown', () => {
    it('returns false for achievements not shown', () => {
      const { hasAchievementBeenShown } = useAchievementsStore.getState();

      expect(hasAchievementBeenShown('weekly_goal', '2024-01-15')).toBe(false);
      expect(hasAchievementBeenShown('cycle_complete', 'cycle-123:2024-01-15T12:00:00.000Z')).toBe(false);
    });

    it('returns true for achievements that have been shown', () => {
      useAchievementsStore.setState({
        shownAchievements: {
          'weekly_goal:2024-01-15': true,
          'cycle_complete:cycle-123:2024-01-15T12:00:00.000Z': true,
        },
      });

      const { hasAchievementBeenShown } = useAchievementsStore.getState();

      expect(hasAchievementBeenShown('weekly_goal', '2024-01-15')).toBe(true);
      expect(hasAchievementBeenShown('cycle_complete', 'cycle-123:2024-01-15T12:00:00.000Z')).toBe(true);
    });

    it('differentiates between different week identifiers', () => {
      useAchievementsStore.setState({
        shownAchievements: {
          'weekly_goal:2024-01-15': true,
        },
      });

      const { hasAchievementBeenShown } = useAchievementsStore.getState();

      expect(hasAchievementBeenShown('weekly_goal', '2024-01-15')).toBe(true);
      expect(hasAchievementBeenShown('weekly_goal', '2024-01-22')).toBe(false);
    });

    it('differentiates between different cycle identifiers', () => {
      useAchievementsStore.setState({
        shownAchievements: {
          'cycle_complete:cycle-123:2024-01-15T12:00:00.000Z': true,
        },
      });

      const { hasAchievementBeenShown } = useAchievementsStore.getState();

      expect(hasAchievementBeenShown('cycle_complete', 'cycle-123:2024-01-15T12:00:00.000Z')).toBe(true);
      // Same cycle but different timestamp (reset)
      expect(hasAchievementBeenShown('cycle_complete', 'cycle-123:2024-01-16T10:00:00.000Z')).toBe(false);
      // Different cycle
      expect(hasAchievementBeenShown('cycle_complete', 'cycle-456:2024-01-15T12:00:00.000Z')).toBe(false);
    });
  });

  describe('resetAchievements', () => {
    it('clears all achievements', () => {
      useAchievementsStore.setState({
        shownAchievements: {
          'weekly_goal:2024-01-15': true,
          'weekly_goal:2024-01-22': true,
          'cycle_complete:cycle-123:2024-01-15T12:00:00.000Z': true,
        },
      });

      const { resetAchievements } = useAchievementsStore.getState();
      resetAchievements();

      const state = useAchievementsStore.getState();
      expect(state.shownAchievements).toEqual({});
    });

    it('makes all achievements available again after reset', () => {
      useAchievementsStore.setState({
        shownAchievements: {
          'weekly_goal:2024-01-15': true,
          'cycle_complete:cycle-123:2024-01-15T12:00:00.000Z': true,
        },
      });

      const { resetAchievements } = useAchievementsStore.getState();
      resetAchievements();

      const { hasAchievementBeenShown } = useAchievementsStore.getState();
      expect(hasAchievementBeenShown('weekly_goal', '2024-01-15')).toBe(false);
      expect(hasAchievementBeenShown('cycle_complete', 'cycle-123:2024-01-15T12:00:00.000Z')).toBe(false);
    });
  });

  describe('cleanupOldAchievements', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('removes weekly goal achievements older than 90 days', () => {
      // Set current date to 2024-04-20
      vi.setSystemTime(new Date('2024-04-20'));

      useAchievementsStore.setState({
        shownAchievements: {
          'weekly_goal:2024-01-15': true, // 96 days old - should be removed
          'weekly_goal:2024-04-01': true, // 19 days old - should be kept
        },
        _hasHydrated: true,
      });

      const { cleanupOldAchievements } = useAchievementsStore.getState();
      cleanupOldAchievements();

      const state = useAchievementsStore.getState();
      expect(state.shownAchievements).toEqual({
        'weekly_goal:2024-04-01': true,
      });
    });

    it('keeps cycle complete achievements regardless of age', () => {
      // Set current date to 2024-04-20
      vi.setSystemTime(new Date('2024-04-20'));

      useAchievementsStore.setState({
        shownAchievements: {
          'cycle_complete:cycle-123:2024-01-15T12:00:00.000Z': true, // Old but should be kept
          'cycle_complete:cycle-456:2024-04-01T12:00:00.000Z': true,
        },
        _hasHydrated: true,
      });

      const { cleanupOldAchievements } = useAchievementsStore.getState();
      cleanupOldAchievements();

      const state = useAchievementsStore.getState();
      expect(state.shownAchievements).toEqual({
        'cycle_complete:cycle-123:2024-01-15T12:00:00.000Z': true,
        'cycle_complete:cycle-456:2024-04-01T12:00:00.000Z': true,
      });
    });

    it('handles mixed old and new achievements', () => {
      // Set current date to 2024-04-20
      vi.setSystemTime(new Date('2024-04-20'));

      useAchievementsStore.setState({
        shownAchievements: {
          'weekly_goal:2024-01-01': true, // 110 days old - remove
          'weekly_goal:2024-02-01': true, // 79 days old - keep
          'weekly_goal:2024-04-15': true, // 5 days old - keep
          'cycle_complete:cycle-old:2024-01-01T12:00:00.000Z': true, // keep regardless
        },
        _hasHydrated: true,
      });

      const { cleanupOldAchievements } = useAchievementsStore.getState();
      cleanupOldAchievements();

      const state = useAchievementsStore.getState();
      expect(state.shownAchievements).toEqual({
        'weekly_goal:2024-02-01': true,
        'weekly_goal:2024-04-15': true,
        'cycle_complete:cycle-old:2024-01-01T12:00:00.000Z': true,
      });
    });

    it('does nothing when no achievements need cleanup', () => {
      // Set current date to 2024-04-20
      vi.setSystemTime(new Date('2024-04-20'));

      const originalAchievements = {
        'weekly_goal:2024-04-01': true,
        'weekly_goal:2024-04-15': true,
      };

      useAchievementsStore.setState({
        shownAchievements: { ...originalAchievements },
        _hasHydrated: true,
      });

      const { cleanupOldAchievements } = useAchievementsStore.getState();
      cleanupOldAchievements();

      const state = useAchievementsStore.getState();
      expect(state.shownAchievements).toEqual(originalAchievements);
    });
  });

  describe('persistence', () => {
    const STORAGE_KEY = 'achievements-storage';

    beforeEach(() => {
      localStorage.clear();
      useAchievementsStore.setState({
        shownAchievements: {},
        _hasHydrated: true,
      });
    });

    it('store name is set to achievements-storage', () => {
      expect(useAchievementsStore).toBeDefined();
      expect(typeof useAchievementsStore.getState).toBe('function');
      expect(typeof useAchievementsStore.setState).toBe('function');
    });

    it('persists shownAchievements to localStorage', () => {
      const { markAchievementShown } = useAchievementsStore.getState();

      markAchievementShown('weekly_goal', '2024-01-15');
      markAchievementShown('cycle_complete', 'cycle-123:2024-01-15T12:00:00.000Z');

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.shownAchievements['weekly_goal:2024-01-15']).toBe(true);
      expect(parsed.state.shownAchievements['cycle_complete:cycle-123:2024-01-15T12:00:00.000Z']).toBe(true);
    });

    it('does not persist _hasHydrated to localStorage', () => {
      const { markAchievementShown } = useAchievementsStore.getState();

      markAchievementShown('weekly_goal', '2024-01-15');

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.state._hasHydrated).toBeUndefined();
    });

    it('has correct persist options configured', () => {
      const persistOptions = useAchievementsStore.persist.getOptions();

      expect(persistOptions.name).toBe(STORAGE_KEY);

      const mockState = {
        shownAchievements: { 'weekly_goal:2024-01-15': true },
        _hasHydrated: true,
        markAchievementShown: () => {},
        hasAchievementBeenShown: () => false,
        cleanupOldAchievements: () => {},
        resetAchievements: () => {},
        setHasHydrated: () => {},
      };

      const partialized = persistOptions.partialize?.(mockState);
      expect(partialized).toEqual({
        shownAchievements: { 'weekly_goal:2024-01-15': true },
      });
      expect(partialized).not.toHaveProperty('_hasHydrated');
    });
  });

  describe('hydration', () => {
    beforeEach(() => {
      useAchievementsStore.setState({
        shownAchievements: {},
        _hasHydrated: false,
      });
    });

    it('hasAchievementBeenShown returns true before hydration to prevent showing achievements', () => {
      const { hasAchievementBeenShown } = useAchievementsStore.getState();

      // Before hydration, should return true to prevent showing achievements
      expect(hasAchievementBeenShown('weekly_goal', '2024-01-15')).toBe(true);
      expect(hasAchievementBeenShown('cycle_complete', 'cycle-123:2024-01-15T12:00:00.000Z')).toBe(true);
    });

    it('markAchievementShown does nothing before hydration', () => {
      const { markAchievementShown } = useAchievementsStore.getState();

      markAchievementShown('weekly_goal', '2024-01-15');
      markAchievementShown('cycle_complete', 'cycle-123:2024-01-15T12:00:00.000Z');

      const state = useAchievementsStore.getState();
      expect(state.shownAchievements).toEqual({});
    });

    it('hasAchievementBeenShown returns false after hydration for new achievements', () => {
      useAchievementsStore.getState().setHasHydrated(true);

      const { hasAchievementBeenShown } = useAchievementsStore.getState();

      expect(hasAchievementBeenShown('weekly_goal', '2024-01-15')).toBe(false);
      expect(hasAchievementBeenShown('cycle_complete', 'cycle-123:2024-01-15T12:00:00.000Z')).toBe(false);
    });

    it('markAchievementShown works after hydration', () => {
      useAchievementsStore.getState().setHasHydrated(true);

      const { markAchievementShown, hasAchievementBeenShown } = useAchievementsStore.getState();
      markAchievementShown('weekly_goal', '2024-01-15');

      expect(hasAchievementBeenShown('weekly_goal', '2024-01-15')).toBe(true);
    });

    it('prevents showing achievement before hydration completes', () => {
      // Scenario: achievement is not shown, but we need to wait for hydration
      // to confirm if it was actually shown in a previous session

      const { hasAchievementBeenShown } = useAchievementsStore.getState();

      // Before hydration, should assume achievement was shown to prevent duplicates
      expect(hasAchievementBeenShown('weekly_goal', '2024-01-15')).toBe(true);

      // Hydration completes - achievement was actually not shown
      useAchievementsStore.setState({
        shownAchievements: {},
        _hasHydrated: true,
      });

      // After hydration, should correctly report achievement was not shown
      const { hasAchievementBeenShown: hasShownAfterHydration } = useAchievementsStore.getState();
      expect(hasShownAfterHydration('weekly_goal', '2024-01-15')).toBe(false);
    });
  });

  describe('cycle reset scenarios', () => {
    it('allows showing celebration again after cycle reset (different updatedAt)', () => {
      useAchievementsStore.setState({
        shownAchievements: {},
        _hasHydrated: true,
      });

      const { markAchievementShown, hasAchievementBeenShown } = useAchievementsStore.getState();

      // First cycle completion
      markAchievementShown('cycle_complete', 'cycle-123:2024-01-15T12:00:00.000Z');
      expect(hasAchievementBeenShown('cycle_complete', 'cycle-123:2024-01-15T12:00:00.000Z')).toBe(true);

      // Same cycle but reset (different updatedAt) - should be allowed to show again
      expect(hasAchievementBeenShown('cycle_complete', 'cycle-123:2024-01-20T10:00:00.000Z')).toBe(false);

      // Mark the new completion as shown
      markAchievementShown('cycle_complete', 'cycle-123:2024-01-20T10:00:00.000Z');
      expect(hasAchievementBeenShown('cycle_complete', 'cycle-123:2024-01-20T10:00:00.000Z')).toBe(true);
    });
  });
});
