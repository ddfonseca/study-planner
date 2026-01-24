import { describe, it, expect } from 'vitest';
import {
  PULL_TO_REFRESH_THRESHOLDS,
  SWIPE_THRESHOLDS,
  SWIPEABLE_ITEM_THRESHOLDS,
  HAPTIC_DURATIONS,
  HAPTIC_PATTERNS,
  THRESHOLDS,
  type PullToRefreshThresholds,
  type SwipeThresholds,
  type SwipeableItemThresholds,
  type HapticDurations,
  type HapticPatterns,
} from './thresholds';

describe('thresholds configuration', () => {
  describe('PULL_TO_REFRESH_THRESHOLDS', () => {
    it('has expected default values', () => {
      expect(PULL_TO_REFRESH_THRESHOLDS.threshold).toBe(80);
      expect(PULL_TO_REFRESH_THRESHOLDS.maxPull).toBe(120);
      expect(PULL_TO_REFRESH_THRESHOLDS.scrollTopThreshold).toBe(5);
      expect(PULL_TO_REFRESH_THRESHOLDS.resistance).toBe(0.5);
    });

    it('has all required properties', () => {
      const thresholds: PullToRefreshThresholds = PULL_TO_REFRESH_THRESHOLDS;
      expect(thresholds).toHaveProperty('threshold');
      expect(thresholds).toHaveProperty('maxPull');
      expect(thresholds).toHaveProperty('scrollTopThreshold');
      expect(thresholds).toHaveProperty('resistance');
    });

    it('resistance is between 0 and 1', () => {
      expect(PULL_TO_REFRESH_THRESHOLDS.resistance).toBeGreaterThan(0);
      expect(PULL_TO_REFRESH_THRESHOLDS.resistance).toBeLessThanOrEqual(1);
    });
  });

  describe('SWIPE_THRESHOLDS', () => {
    it('has expected default values', () => {
      expect(SWIPE_THRESHOLDS.minSwipeDistance).toBe(50);
      expect(SWIPE_THRESHOLDS.maxSwipeTime).toBe(300);
    });

    it('has all required properties', () => {
      const thresholds: SwipeThresholds = SWIPE_THRESHOLDS;
      expect(thresholds).toHaveProperty('minSwipeDistance');
      expect(thresholds).toHaveProperty('maxSwipeTime');
    });

    it('values are positive numbers', () => {
      expect(SWIPE_THRESHOLDS.minSwipeDistance).toBeGreaterThan(0);
      expect(SWIPE_THRESHOLDS.maxSwipeTime).toBeGreaterThan(0);
    });
  });

  describe('SWIPEABLE_ITEM_THRESHOLDS', () => {
    it('has expected default values', () => {
      expect(SWIPEABLE_ITEM_THRESHOLDS.deleteButtonWidth).toBe(72);
      expect(SWIPEABLE_ITEM_THRESHOLDS.revealThreshold).toBe(40);
      expect(SWIPEABLE_ITEM_THRESHOLDS.verticalScrollThreshold).toBe(10);
      expect(SWIPEABLE_ITEM_THRESHOLDS.horizontalDragThreshold).toBe(10);
    });

    it('has all required properties', () => {
      const thresholds: SwipeableItemThresholds = SWIPEABLE_ITEM_THRESHOLDS;
      expect(thresholds).toHaveProperty('deleteButtonWidth');
      expect(thresholds).toHaveProperty('revealThreshold');
      expect(thresholds).toHaveProperty('verticalScrollThreshold');
      expect(thresholds).toHaveProperty('horizontalDragThreshold');
    });

    it('revealThreshold is less than deleteButtonWidth', () => {
      expect(SWIPEABLE_ITEM_THRESHOLDS.revealThreshold).toBeLessThan(
        SWIPEABLE_ITEM_THRESHOLDS.deleteButtonWidth
      );
    });
  });

  describe('HAPTIC_DURATIONS', () => {
    it('has expected default values', () => {
      expect(HAPTIC_DURATIONS.light).toBe(10);
      expect(HAPTIC_DURATIONS.medium).toBe(30);
      expect(HAPTIC_DURATIONS.heavy).toBe(50);
    });

    it('has all required properties', () => {
      const durations: HapticDurations = HAPTIC_DURATIONS;
      expect(durations).toHaveProperty('light');
      expect(durations).toHaveProperty('medium');
      expect(durations).toHaveProperty('heavy');
    });

    it('durations increase with intensity', () => {
      expect(HAPTIC_DURATIONS.light).toBeLessThan(HAPTIC_DURATIONS.medium);
      expect(HAPTIC_DURATIONS.medium).toBeLessThan(HAPTIC_DURATIONS.heavy);
    });
  });

  describe('HAPTIC_PATTERNS', () => {
    it('has expected default values', () => {
      expect(HAPTIC_PATTERNS.success).toEqual([10, 50, 30]);
      expect(HAPTIC_PATTERNS.error).toEqual([50, 30, 50, 30, 50]);
      expect(HAPTIC_PATTERNS.warning).toEqual([30, 50, 30]);
    });

    it('has all required properties', () => {
      const patterns: HapticPatterns = HAPTIC_PATTERNS;
      expect(patterns).toHaveProperty('success');
      expect(patterns).toHaveProperty('error');
      expect(patterns).toHaveProperty('warning');
    });

    it('patterns are non-empty arrays', () => {
      expect(HAPTIC_PATTERNS.success.length).toBeGreaterThan(0);
      expect(HAPTIC_PATTERNS.error.length).toBeGreaterThan(0);
      expect(HAPTIC_PATTERNS.warning.length).toBeGreaterThan(0);
    });

    it('patterns contain only positive numbers', () => {
      const allPatterns = [
        ...HAPTIC_PATTERNS.success,
        ...HAPTIC_PATTERNS.error,
        ...HAPTIC_PATTERNS.warning,
      ];
      allPatterns.forEach((value) => {
        expect(value).toBeGreaterThan(0);
      });
    });
  });

  describe('THRESHOLDS (combined)', () => {
    it('contains all threshold categories', () => {
      expect(THRESHOLDS).toHaveProperty('pullToRefresh');
      expect(THRESHOLDS).toHaveProperty('swipe');
      expect(THRESHOLDS).toHaveProperty('swipeableItem');
      expect(THRESHOLDS).toHaveProperty('hapticDurations');
      expect(THRESHOLDS).toHaveProperty('hapticPatterns');
    });

    it('references the same objects as individual exports', () => {
      expect(THRESHOLDS.pullToRefresh).toBe(PULL_TO_REFRESH_THRESHOLDS);
      expect(THRESHOLDS.swipe).toBe(SWIPE_THRESHOLDS);
      expect(THRESHOLDS.swipeableItem).toBe(SWIPEABLE_ITEM_THRESHOLDS);
      expect(THRESHOLDS.hapticDurations).toBe(HAPTIC_DURATIONS);
      expect(THRESHOLDS.hapticPatterns).toBe(HAPTIC_PATTERNS);
    });
  });
});
