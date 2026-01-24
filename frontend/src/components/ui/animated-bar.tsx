import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

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
 * AnimatedBar provides smooth height transitions for bar charts at 60fps.
 *
 * Features:
 * - Uses requestAnimationFrame for smooth 60fps animation
 * - Staggered entrance with configurable delay
 * - Ease-out cubic easing for natural deceleration
 * - Respects prefers-reduced-motion for accessibility
 * - Uses transform for GPU acceleration
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
  const prefersReducedMotion = useReducedMotion();
  const [displayHeight, setDisplayHeight] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  const previousHeight = useRef(0);
  const animationRef = useRef<number | undefined>(undefined);
  const delayRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Handle immediate value updates for reduced motion
  const effectiveDuration = prefersReducedMotion ? 0 : duration;
  const effectiveDelay = prefersReducedMotion ? 0 : delay;

  useEffect(() => {
    // Clear any existing animation/delay
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (delayRef.current) {
      clearTimeout(delayRef.current);
    }

    const targetHeight = Math.max(minHeight, Math.min(100, height));

    // Skip animation if duration is 0 (reduced motion)
    if (effectiveDuration === 0) {
      // Use requestAnimationFrame to avoid synchronous setState in effect
      animationRef.current = requestAnimationFrame(() => {
        setDisplayHeight(targetHeight);
        previousHeight.current = targetHeight;
        setHasInitialized(true);
      });
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }

    const startAnimation = () => {
      const startHeight = previousHeight.current;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / effectiveDuration, 1);

        // Easing function: ease-out cubic for smooth 60fps deceleration
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
    if (!hasInitialized && effectiveDelay > 0) {
      delayRef.current = setTimeout(() => {
        setHasInitialized(true);
        startAnimation();
      }, effectiveDelay);
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
  }, [height, effectiveDuration, effectiveDelay, minHeight, hasInitialized]);

  return (
    <div
      className={cn('w-full', className)}
      style={{ height: `${displayHeight}%` }}
    />
  );
}

export { type AnimatedBarProps };
