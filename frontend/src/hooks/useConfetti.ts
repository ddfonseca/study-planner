import { useState, useCallback, useRef, useEffect } from 'react';

interface UseConfettiOptions {
  /** Duration in ms before confetti stops (default: 3000) */
  duration?: number;
  /** Number of particles (default: 100) */
  particleCount?: number;
}

interface UseConfettiReturn {
  /** Whether confetti is currently active */
  isActive: boolean;
  /** Trigger the confetti animation */
  fire: () => void;
  /** Stop the confetti animation */
  stop: () => void;
  /** Props to spread on the Confetti component */
  confettiProps: {
    active: boolean;
    duration: number;
    particleCount: number;
    onComplete: () => void;
  };
}

/**
 * Hook to control confetti animations imperatively.
 *
 * Usage:
 * ```tsx
 * const { fire, confettiProps } = useConfetti();
 *
 * // Trigger confetti
 * fire();
 *
 * // Render confetti component
 * <Confetti {...confettiProps} />
 * ```
 */
export function useConfetti(options: UseConfettiOptions = {}): UseConfettiReturn {
  const { duration = 3000, particleCount = 100 } = options;

  const [isActive, setIsActive] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fire = useCallback(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsActive(true);

    // Auto-stop after duration as backup
    timeoutRef.current = setTimeout(() => {
      setIsActive(false);
    }, duration + 500); // Add buffer for fade out
  }, [duration]);

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsActive(false);
  }, []);

  const handleComplete = useCallback(() => {
    setIsActive(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isActive,
    fire,
    stop,
    confettiProps: {
      active: isActive,
      duration,
      particleCount,
      onComplete: handleComplete,
    },
  };
}

export default useConfetti;
