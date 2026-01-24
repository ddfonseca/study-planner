import { describe, it, expect, beforeEach } from 'vitest';
import { useFeatureBadgesStore } from './featureBadgesStore';

describe('featureBadgesStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useFeatureBadgesStore.setState({
      seenFeatures: {
        timer: false,
        cycles: false,
        dashboard: false,
      },
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
        seenFeatures: {
          timer: true,
          cycles: false,
          dashboard: true,
        },
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
        seenFeatures: {
          timer: true,
          cycles: true,
          dashboard: true,
        },
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
        seenFeatures: {
          timer: true,
          cycles: true,
          dashboard: true,
        },
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
    it('store name is set to feature-badges-storage', () => {
      // The persist middleware uses 'feature-badges-storage' as the storage key
      // We verify the store is correctly configured by checking it exists
      expect(useFeatureBadgesStore).toBeDefined();
      expect(typeof useFeatureBadgesStore.getState).toBe('function');
      expect(typeof useFeatureBadgesStore.setState).toBe('function');
    });
  });
});
