import { useState, useEffect } from 'react';

/**
 * Hook to detect media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    // Create listener
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    mediaQuery.addEventListener('change', handler);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [query]);

  return matches;
}

/**
 * Hook to detect if device is mobile (< 768px)
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/**
 * Hook to detect if device is tablet or smaller (< 1024px)
 * Useful for showing simplified layouts on tablets
 */
export function useIsTabletOrSmaller(): boolean {
  return useMediaQuery('(max-width: 1023px)');
}

/**
 * Hook to detect if device is small mobile (< 640px)
 * For compact mobile-only layouts
 */
export function useIsSmallMobile(): boolean {
  return useMediaQuery('(max-width: 639px)');
}

/**
 * Hook to detect if device has touch capability
 * Uses 'pointer: coarse' media query which detects touch-primary devices
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(() => {
    if (typeof window !== 'undefined') {
      // Check for coarse pointer (touch) or if touch events are supported
      return (
        window.matchMedia('(pointer: coarse)').matches ||
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0
      );
    }
    return false;
  });

  useEffect(() => {
    // Also listen for touch events to detect hybrid devices
    const handleTouchStart = () => {
      if (!isTouch) {
        setIsTouch(true);
        document.documentElement.classList.add('touch-device');
      }
    };

    // Add touch-device class to document for CSS targeting
    if (isTouch) {
      document.documentElement.classList.add('touch-device');
    }

    window.addEventListener('touchstart', handleTouchStart, { once: true, passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, [isTouch]);

  return isTouch;
}

export default useMediaQuery;
