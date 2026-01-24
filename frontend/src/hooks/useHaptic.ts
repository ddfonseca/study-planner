import { useCallback, useMemo } from 'react';
import { useIsTouchDevice } from './useMediaQuery';

/**
 * Haptic feedback intensity levels
 * - light: Quick tap feedback (10ms) - for gesture detection, selections
 * - medium: Confirmation feedback (30ms) - for action confirmations
 * - heavy: Strong feedback (50ms) - for destructive actions, major state changes
 */
export type HapticIntensity = 'light' | 'medium' | 'heavy';

/**
 * Predefined haptic patterns for specific actions
 */
export type HapticPattern = 'success' | 'error' | 'warning';

interface UseHapticReturn {
  /** Trigger haptic feedback at specified intensity */
  trigger: (intensity?: HapticIntensity) => void;
  /** Trigger a predefined haptic pattern */
  triggerPattern: (pattern: HapticPattern) => void;
  /** Whether haptic feedback is supported on this device */
  isSupported: boolean;
}

// Vibration durations in milliseconds for each intensity
const INTENSITY_DURATIONS: Record<HapticIntensity, number> = {
  light: 10,
  medium: 30,
  heavy: 50,
};

// Vibration patterns for specific feedback types
// Format: [vibrate, pause, vibrate, pause, ...]
const PATTERNS: Record<HapticPattern, number[]> = {
  success: [10, 50, 30], // Quick pulse then longer pulse
  error: [50, 30, 50, 30, 50], // Triple vibration
  warning: [30, 50, 30], // Double pulse
};

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
export function useHaptic(): UseHapticReturn {
  const isTouchDevice = useIsTouchDevice();
  const isSupported = useMemo(
    () => isTouchDevice && isVibrationSupported(),
    [isTouchDevice]
  );

  const trigger = useCallback(
    (intensity: HapticIntensity = 'light') => {
      if (!isSupported) return;

      try {
        navigator.vibrate(INTENSITY_DURATIONS[intensity]);
      } catch {
        // Silently fail if vibration not allowed
      }
    },
    [isSupported]
  );

  const triggerPattern = useCallback(
    (pattern: HapticPattern) => {
      if (!isSupported) return;

      try {
        navigator.vibrate(PATTERNS[pattern]);
      } catch {
        // Silently fail if vibration not allowed
      }
    },
    [isSupported]
  );

  return { trigger, triggerPattern, isSupported };
}

export default useHaptic;
