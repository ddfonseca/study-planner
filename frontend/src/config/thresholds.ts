/**
 * Configurable thresholds for touch interactions and UI behaviors
 *
 * This module centralizes all threshold values that control touch gestures,
 * haptic feedback, and other UI behaviors. These values can be adjusted
 * to fine-tune the user experience across different devices.
 */

/**
 * Pull-to-refresh thresholds
 */
export interface PullToRefreshThresholds {
  /** Pull distance required to trigger refresh (pixels) */
  threshold: number;
  /** Maximum pull distance (pixels) */
  maxPull: number;
  /** Scroll position threshold to allow pull-to-refresh (pixels) */
  scrollTopThreshold: number;
  /** Drag resistance factor (0-1, lower = more resistance) */
  resistance: number;
}

export const PULL_TO_REFRESH_THRESHOLDS: PullToRefreshThresholds = {
  threshold: 80,
  maxPull: 120,
  scrollTopThreshold: 5,
  resistance: 0.5,
};

/**
 * Swipe gesture thresholds
 */
export interface SwipeThresholds {
  /** Minimum horizontal distance for a swipe (pixels) */
  minSwipeDistance: number;
  /** Maximum time for a swipe gesture (milliseconds) */
  maxSwipeTime: number;
}

export const SWIPE_THRESHOLDS: SwipeThresholds = {
  minSwipeDistance: 50,
  maxSwipeTime: 300,
};

/**
 * Swipeable item thresholds (for swipe-to-reveal actions)
 */
export interface SwipeableItemThresholds {
  /** Width of the delete action button (pixels) */
  deleteButtonWidth: number;
  /** Minimum swipe distance to reveal delete action (pixels) */
  revealThreshold: number;
  /** Movement threshold to detect vertical scrolling (pixels) */
  verticalScrollThreshold: number;
  /** Movement threshold to start horizontal drag (pixels) */
  horizontalDragThreshold: number;
}

export const SWIPEABLE_ITEM_THRESHOLDS: SwipeableItemThresholds = {
  deleteButtonWidth: 72,
  revealThreshold: 40,
  verticalScrollThreshold: 10,
  horizontalDragThreshold: 10,
};

/**
 * Haptic feedback durations (milliseconds)
 */
export interface HapticDurations {
  /** Light tap feedback for gesture detection, selections */
  light: number;
  /** Confirmation feedback for action confirmations */
  medium: number;
  /** Strong feedback for destructive actions, major state changes */
  heavy: number;
}

export const HAPTIC_DURATIONS: HapticDurations = {
  light: 10,
  medium: 30,
  heavy: 50,
};

/**
 * Haptic feedback patterns
 * Format: [vibrate, pause, vibrate, pause, ...]
 */
export interface HapticPatterns {
  /** Quick pulse then longer pulse */
  success: number[];
  /** Triple vibration for errors */
  error: number[];
  /** Double pulse for warnings */
  warning: number[];
}

export const HAPTIC_PATTERNS: HapticPatterns = {
  success: [10, 50, 30],
  error: [50, 30, 50, 30, 50],
  warning: [30, 50, 30],
};

/**
 * All thresholds combined for easy access
 */
export interface AllThresholds {
  pullToRefresh: PullToRefreshThresholds;
  swipe: SwipeThresholds;
  swipeableItem: SwipeableItemThresholds;
  hapticDurations: HapticDurations;
  hapticPatterns: HapticPatterns;
}

export const THRESHOLDS: AllThresholds = {
  pullToRefresh: PULL_TO_REFRESH_THRESHOLDS,
  swipe: SWIPE_THRESHOLDS,
  swipeableItem: SWIPEABLE_ITEM_THRESHOLDS,
  hapticDurations: HAPTIC_DURATIONS,
  hapticPatterns: HAPTIC_PATTERNS,
};

export default THRESHOLDS;
