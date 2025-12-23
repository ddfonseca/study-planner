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

export default useMediaQuery;
