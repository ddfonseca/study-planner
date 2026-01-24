import { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface AnimatedNumberProps {
  /** The target value to animate to */
  value: number;
  /** Duration of animation in ms (default: 500) */
  duration?: number;
  /** Number of decimal places (default: 0) */
  decimals?: number;
  /** Format function for the displayed value */
  format?: (value: number) => string;
  /** Additional className */
  className?: string;
}

/**
 * AnimatedNumber smoothly transitions between numeric values at 60fps.
 *
 * Features:
 * - Uses requestAnimationFrame for smooth 60fps animation
 * - Ease-out cubic easing for natural deceleration
 * - Respects prefers-reduced-motion for accessibility
 * - GPU-friendly (no layout thrashing)
 *
 * Perfect for:
 * - Progress percentages
 * - Statistics counters
 * - Timer displays
 * - Score updates
 */
export function AnimatedNumber({
  value,
  duration = 500,
  decimals = 0,
  format,
  className,
}: AnimatedNumberProps) {
  const prefersReducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);
  const animationRef = useRef<number | undefined>(undefined);

  // Handle immediate value updates for reduced motion
  const effectiveDuration = prefersReducedMotion ? 0 : duration;

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;

    // Don't animate if values are the same
    if (startValue === endValue) {
      return;
    }

    // Skip animation if duration is 0 (reduced motion)
    if (effectiveDuration === 0) {
      // Use requestAnimationFrame to avoid synchronous setState in effect
      animationRef.current = requestAnimationFrame(() => {
        setDisplayValue(endValue);
        previousValue.current = endValue;
      });
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / effectiveDuration, 1);

      // Easing function: ease-out cubic for smooth 60fps deceleration
      const eased = 1 - Math.pow(1 - progress, 3);

      const currentValue = startValue + (endValue - startValue) * eased;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        previousValue.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, effectiveDuration]);

  const formattedValue = format
    ? format(displayValue)
    : displayValue.toFixed(decimals);

  return <span className={className}>{formattedValue}</span>;
}

export { type AnimatedNumberProps };
