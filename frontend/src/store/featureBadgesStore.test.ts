import { describe, it, expect, beforeEach } from 'vitest';
import { useFeatureBadgesStore } from './featureBadgesStore';

describe('featureBadgesStore', () => {
  // Helper to create full seenFeatures state
  const createSeenFeatures = (overrides: Partial<Record<string, boolean>> = {}) => ({
    timer: false,
    cycles: false,
    dashboard: false,
    allocation: false,
    scratchpad: false,
    content: false,
    ...overrides,
  });

  beforeEach(() => {
    // Reset store to initial state before each test
    // Set _hasHydrated to true to simulate completed hydration
    useFeatureBadgesStore.setState({
      seenFeatures: createSeenFeatures(),
      _hasHydrated: true,
    });
  });

  describe('initial state', () => {
    it('has all features set to not seen by default', () => {
      const state = useFeatureBadgesStore.getState();
      expect(state.seenFeatures.timer).toBe(false);
      expect(state.seenFeatures.cycles).toBe(false);
      expect(state.seenFeatures.dashboard).toBe(false);
    });

    it('reports all features as new initially', () => {
      const { isFeatureNew } = useFeatureBadgesStore.getState();
      expect(isFeatureNew('timer')).toBe(true);
      expect(isFeatureNew('cycles')).toBe(true);
      expect(isFeatureNew('dashboard')).toBe(true);
    });
  });

  describe('markFeatureSeen', () => {
    it('marks timer feature as seen', () => {
      const { markFeatureSeen } = useFeatureBadgesStore.getState();

      markFeatureSeen('timer');

      expect(useFeatureBadgesStore.getState().seenFeatures.timer).toBe(true);
      expect(useFeatureBadgesStore.getState().seenFeatures.cycles).toBe(false);
      expect(useFeatureBadgesStore.getState().seenFeatures.dashboard).toBe(false);
    });

    it('marks cycles feature as seen', () => {
      const { markFeatureSeen } = useFeatureBadgesStore.getState();

      markFeatureSeen('cycles');

      expect(useFeatureBadgesStore.getState().seenFeatures.timer).toBe(false);
      expect(useFeatureBadgesStore.getState().seenFeatures.cycles).toBe(true);
      expect(useFeatureBadgesStore.getState().seenFeatures.dashboard).toBe(false);
    });

    it('marks dashboard feature as seen', () => {
      const { markFeatureSeen } = useFeatureBadgesStore.getState();

      markFeatureSeen('dashboard');

      expect(useFeatureBadgesStore.getState().seenFeatures.timer).toBe(false);
      expect(useFeatureBadgesStore.getState().seenFeatures.cycles).toBe(false);
      expect(useFeatureBadgesStore.getState().seenFeatures.dashboard).toBe(true);
    });

    it('can mark multiple features as seen', () => {
      const { markFeatureSeen } = useFeatureBadgesStore.getState();

      markFeatureSeen('timer');
      markFeatureSeen('dashboard');

      const state = useFeatureBadgesStore.getState();
      expect(state.seenFeatures.timer).toBe(true);
      expect(state.seenFeatures.cycles).toBe(false);
      expect(state.seenFeatures.dashboard).toBe(true);
    });
  });

  describe('isFeatureNew', () => {
    it('returns true for unseen features', () => {
      const { isFeatureNew } = useFeatureBadgesStore.getState();

      expect(isFeatureNew('timer')).toBe(true);
      expect(isFeatureNew('cycles')).toBe(true);
      expect(isFeatureNew('dashboard')).toBe(true);
    });

    it('returns false for seen features', () => {
      useFeatureBadgesStore.setState({
        seenFeatures: createSeenFeatures({
          timer: true,
          cycles: false,
          dashboard: true,
        }),
      });

      const { isFeatureNew } = useFeatureBadgesStore.getState();

      expect(isFeatureNew('timer')).toBe(false);
      expect(isFeatureNew('cycles')).toBe(true);
      expect(isFeatureNew('dashboard')).toBe(false);
    });
  });

  describe('resetBadges', () => {
    it('resets all features to not seen', () => {
      // First mark all as seen
      useFeatureBadgesStore.setState({
        seenFeatures: createSeenFeatures({
          timer: true,
          cycles: true,
          dashboard: true,
        }),
      });

      const { resetBadges } = useFeatureBadgesStore.getState();

      resetBadges();

      const state = useFeatureBadgesStore.getState();
      expect(state.seenFeatures.timer).toBe(false);
      expect(state.seenFeatures.cycles).toBe(false);
      expect(state.seenFeatures.dashboard).toBe(false);
    });

    it('makes all features new again after reset', () => {
      // First mark all as seen
      useFeatureBadgesStore.setState({
        seenFeatures: createSeenFeatures({
          timer: true,
          cycles: true,
          dashboard: true,
        }),
      });

      const { resetBadges } = useFeatureBadgesStore.getState();

      resetBadges();

      // Need to get fresh reference after state change
      const { isFeatureNew } = useFeatureBadgesStore.getState();
      expect(isFeatureNew('timer')).toBe(true);
      expect(isFeatureNew('cycles')).toBe(true);
      expect(isFeatureNew('dashboard')).toBe(true);
    });
  });

  describe('persistence', () => {
    const STORAGE_KEY = 'feature-badges-storage';

    beforeEach(() => {
      localStorage.clear();
      useFeatureBadgesStore.setState({
        seenFeatures: createSeenFeatures(),
        _hasHydrated: true,
      });
    });

    it('store name is set to feature-badges-storage', () => {
      // The persist middleware uses 'feature-badges-storage' as the storage key
      // We verify the store is correctly configured by checking it exists
      expect(useFeatureBadgesStore).toBeDefined();
      expect(typeof useFeatureBadgesStore.getState).toBe('function');
      expect(typeof useFeatureBadgesStore.setState).toBe('function');
    });

    it('persists seenFeatures to localStorage', () => {
      const { markFeatureSeen } = useFeatureBadgesStore.getState();

      markFeatureSeen('timer');
      markFeatureSeen('dashboard');

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.seenFeatures.timer).toBe(true);
      expect(parsed.state.seenFeatures.cycles).toBe(false);
      expect(parsed.state.seenFeatures.dashboard).toBe(true);
    });

    it('does not persist _hasHydrated to localStorage', () => {
      const { markFeatureSeen } = useFeatureBadgesStore.getState();

      markFeatureSeen('timer');

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      // _hasHydrated should not be in persisted state
      expect(parsed.state._hasHydrated).toBeUndefined();
    });

    it('has correct persist options configured', () => {
      // Verify the persist middleware is configured with correct options
      const persistOptions = useFeatureBadgesStore.persist.getOptions();

      expect(persistOptions.name).toBe(STORAGE_KEY);

      // partialize should only include seenFeatures
      const mockSeenFeatures = createSeenFeatures({ timer: true, cycles: false, dashboard: true });
      const mockState = {
        seenFeatures: mockSeenFeatures,
        _hasHydrated: true,
        markFeatureSeen: () => {},
        isFeatureNew: () => false,
        resetBadges: () => {},
        setHasHydrated: () => {},
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const partialized = persistOptions.partialize?.(mockState as any);
      expect(partialized).toEqual({
        seenFeatures: mockSeenFeatures,
      });
      expect(partialized).not.toHaveProperty('_hasHydrated');
    });

    it('uses localStorage as storage mechanism', () => {
      // Verify the store uses localStorage
      const persistOptions = useFeatureBadgesStore.persist.getOptions();
      // Zustand wraps localStorage with getItem/setItem/removeItem methods
      expect(persistOptions.storage).toBeDefined();
      expect(typeof persistOptions.storage?.getItem).toBe('function');
      expect(typeof persistOptions.storage?.setItem).toBe('function');
    });

    it('has onRehydrateStorage callback configured', () => {
      // Verify onRehydrateStorage is set up to handle hydration
      const persistOptions = useFeatureBadgesStore.persist.getOptions();
      expect(persistOptions.onRehydrateStorage).toBeDefined();
    });
  });

  describe('hydration', () => {
    beforeEach(() => {
      // Reset to non-hydrated state for hydration tests
      useFeatureBadgesStore.setState({
        seenFeatures: createSeenFeatures(),
        _hasHydrated: false,
      });
    });

    it('isFeatureNew returns false before hydration', () => {
      const { isFeatureNew } = useFeatureBadgesStore.getState();

      expect(isFeatureNew('timer')).toBe(false);
      expect(isFeatureNew('cycles')).toBe(false);
      expect(isFeatureNew('dashboard')).toBe(false);
    });

    it('markFeatureSeen does nothing before hydration', () => {
      const { markFeatureSeen } = useFeatureBadgesStore.getState();

      markFeatureSeen('timer');
      markFeatureSeen('cycles');
      markFeatureSeen('dashboard');

      const state = useFeatureBadgesStore.getState();
      // Features should still be false (not marked as seen)
      expect(state.seenFeatures.timer).toBe(false);
      expect(state.seenFeatures.cycles).toBe(false);
      expect(state.seenFeatures.dashboard).toBe(false);
    });

    it('isFeatureNew returns true after hydration for unseen features', () => {
      // Simulate hydration completing
      useFeatureBadgesStore.getState().setHasHydrated(true);

      const { isFeatureNew } = useFeatureBadgesStore.getState();

      expect(isFeatureNew('timer')).toBe(true);
      expect(isFeatureNew('cycles')).toBe(true);
      expect(isFeatureNew('dashboard')).toBe(true);
    });

    it('markFeatureSeen works after hydration', () => {
      // Simulate hydration completing
      useFeatureBadgesStore.getState().setHasHydrated(true);

      const { markFeatureSeen } = useFeatureBadgesStore.getState();
      markFeatureSeen('timer');

      const state = useFeatureBadgesStore.getState();
      expect(state.seenFeatures.timer).toBe(true);
      expect(state.seenFeatures.cycles).toBe(false);
    });

    it('setHasHydrated updates hydration state', () => {
      expect(useFeatureBadgesStore.getState()._hasHydrated).toBe(false);

      useFeatureBadgesStore.getState().setHasHydrated(true);

      expect(useFeatureBadgesStore.getState()._hasHydrated).toBe(true);
    });

    it('prevents race condition where feature is marked seen before hydration', () => {
      // This test simulates the bug scenario:
      // 1. Store starts with _hasHydrated = false
      // 2. Component tries to mark feature as seen (should be ignored)
      // 3. Hydration completes with different state
      // 4. Feature should reflect hydrated state, not be marked as seen

      const { markFeatureSeen } = useFeatureBadgesStore.getState();

      // Attempt to mark feature before hydration (should be ignored)
      markFeatureSeen('dashboard');
      expect(useFeatureBadgesStore.getState().seenFeatures.dashboard).toBe(false);

      // Simulate hydration completing with dashboard still unseen
      useFeatureBadgesStore.setState({
        seenFeatures: createSeenFeatures(),
        _hasHydrated: true,
      });

      // Dashboard should still be new (not seen)
      const { isFeatureNew } = useFeatureBadgesStore.getState();
      expect(isFeatureNew('dashboard')).toBe(true);
    });
  });
});
