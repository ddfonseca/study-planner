import { useCallback, useMemo } from 'react';
import { useIsTouchDevice } from './useMediaQuery';
import {
  HAPTIC_DURATIONS,
  HAPTIC_PATTERNS,
  type HapticDurations,
  type HapticPatterns,
} from '@/config/thresholds';

/**
 * Haptic feedback intensity levels
 * - light: Quick tap feedback - for gesture detection, selections
 * - medium: Confirmation feedback - for action confirmations
 * - heavy: Strong feedback - for destructive actions, major state changes
 */
export type HapticIntensity = 'light' | 'medium' | 'heavy';

/**
 * Predefined haptic patterns for specific actions
 */
export type HapticPattern = 'success' | 'error' | 'warning';

interface UseHapticOptions {
  /** Custom haptic durations */
  durations?: Partial<HapticDurations>;
  /** Custom haptic patterns */
  patterns?: Partial<HapticPatterns>;
}

interface UseHapticReturn {
  /** Trigger haptic feedback at specified intensity */
  trigger: (intensity?: HapticIntensity) => void;
  /** Trigger a predefined haptic pattern */
  triggerPattern: (pattern: HapticPattern) => void;
  /** Whether haptic feedback is supported on this device */
  isSupported: boolean;
}

/**
 * Check if the Vibration API is supported
 */
function isVibrationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Hook to trigger haptic feedback on touch devices
 * Uses the Web Vibration API with graceful fallback
 */
export function useHaptic(options: UseHapticOptions = {}): UseHapticReturn {
  const { durations, patterns } = options;

  // Merge custom config with defaults
  const effectiveDurations = useMemo(
    () => ({
      ...HAPTIC_DURATIONS,
      ...durations,
    }),
    [durations]
  );

  const effectivePatterns = useMemo(
    () => ({
      ...HAPTIC_PATTERNS,
      ...patterns,
    }),
    [patterns]
  );

  const isTouchDevice = useIsTouchDevice();
  const isSupported = useMemo(
    () => isTouchDevice && isVibrationSupported(),
    [isTouchDevice]
  );

  const trigger = useCallback(
    (intensity: HapticIntensity = 'light') => {
      if (!isSupported) return;

      try {
        navigator.vibrate(effectiveDurations[intensity]);
      } catch {
        // Silently fail if vibration not allowed
      }
    },
    [isSupported, effectiveDurations]
  );

  const triggerPattern = useCallback(
    (pattern: HapticPattern) => {
      if (!isSupported) return;

      try {
        navigator.vibrate(effectivePatterns[pattern]);
      } catch {
        // Silently fail if vibration not allowed
      }
    },
    [isSupported, effectivePatterns]
  );

  return { trigger, triggerPattern, isSupported };
}

export default useHaptic;
