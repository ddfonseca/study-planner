import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedBarProps {
  /** Target height percentage (0-100) */
  height: number;
  /** Duration of animation in ms (default: 400) */
  duration?: number;
  /** Delay before animation starts in ms (default: 0) */
  delay?: number;
  /** Additional className */
  className?: string;
  /** Minimum height in percentage (default: 0) */
  minHeight?: number;
}

/**
 * AnimatedBar provides smooth height transitions for bar charts.
 *
 * Perfect for:
 * - Bar charts with data updates
 * - Weekly/daily progress bars
 * - Staggered entrance animations
 */
export function AnimatedBar({
  height,
  duration = 400,
  delay = 0,
  className,
  minHeight = 0,
}: AnimatedBarProps) {
  const [displayHeight, setDisplayHeight] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  const previousHeight = useRef(0);
  const animationRef = useRef<number | undefined>(undefined);
  const delayRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    // Clear any existing animation/delay
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (delayRef.current) {
      clearTimeout(delayRef.current);
    }

    const targetHeight = Math.max(minHeight, Math.min(100, height));

    const startAnimation = () => {
      const startHeight = previousHeight.current;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function: ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);

        const currentHeight = startHeight + (targetHeight - startHeight) * eased;
        setDisplayHeight(currentHeight);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setDisplayHeight(targetHeight);
          previousHeight.current = targetHeight;
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    };

    // Apply delay only on initial mount
    if (!hasInitialized && delay > 0) {
      delayRef.current = setTimeout(() => {
        setHasInitialized(true);
        startAnimation();
      }, delay);
    } else {
      startAnimation();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (delayRef.current) {
        clearTimeout(delayRef.current);
      }
    };
  }, [height, duration, delay, minHeight, hasInitialized]);

  return (
    <div
      className={cn('w-full', className)}
      style={{ height: `${displayHeight}%` }}
    />
  );
}

export { type AnimatedBarProps };
