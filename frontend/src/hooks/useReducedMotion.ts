import { useState, useEffect } from 'react';

/**
 * Custom hook to detect user's reduced motion preference
 * Returns true if user prefers reduced motion (accessibility setting)
 *
 * This respects the prefers-reduced-motion media query which can be set:
 * - System-wide in OS accessibility settings
 * - Per-browser in browser settings
 *
 * Use this hook to:
 * - Skip or simplify animations for users who prefer reduced motion
 * - Provide instant transitions instead of animated ones
 * - Disable parallax, auto-playing animations, etc.
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // Check if window is available (SSR safety)
    if (typeof window === 'undefined') {
      return false;
    }
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery.matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Listen for changes to the media query
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Returns animation duration based on reduced motion preference
 * @param normalDuration - Duration in ms when animations are enabled
 * @param reducedDuration - Duration in ms when reduced motion is preferred (default: 0)
 */
export function useAnimationDuration(
  normalDuration: number,
  reducedDuration: number = 0
): number {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? reducedDuration : normalDuration;
}

/**
 * Returns appropriate easing function based on reduced motion preference
 * When reduced motion is preferred, returns linear for instant feel
 */
export function useEasing(): (progress: number) => number {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    // Linear easing - instant feel
    return (progress: number) => progress;
  }

  // Ease-out cubic - smooth deceleration
  return (progress: number) => 1 - Math.pow(1 - progress, 3);
}
