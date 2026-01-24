import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface AnimatedProgressProps {
  /** Current progress value (0-100) */
  value: number;
  /** Size of the circular progress in pixels (default: 64) */
  size?: number;
  /** Stroke width in pixels (default: 3) */
  strokeWidth?: number;
  /** Duration of animation in ms (default: 500) */
  duration?: number;
  /** Additional className for the container */
  className?: string;
  /** Additional className for the track circle */
  trackClassName?: string;
  /** Additional className for the progress circle */
  progressClassName?: string;
  /** Children to render in the center */
  children?: React.ReactNode;
}

/**
 * AnimatedProgress provides a smooth animated circular progress indicator at 60fps.
 *
 * Features:
 * - Uses requestAnimationFrame for smooth 60fps animation
 * - SVG-based rendering (GPU accelerated, scale-independent)
 * - Ease-out cubic easing for natural deceleration
 * - Respects prefers-reduced-motion for accessibility
 *
 * Perfect for:
 * - Weekly/daily progress
 * - Goal completion
 * - Loading states with progress
 */
export function AnimatedProgress({
  value,
  size = 64,
  strokeWidth = 3,
  duration = 500,
  className,
  trackClassName,
  progressClassName,
  children,
}: AnimatedProgressProps) {
  const prefersReducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);
  const animationRef = useRef<number | undefined>(undefined);

  // SVG circle calculations
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const viewBox = `0 0 ${size} ${size}`;
  const center = size / 2;

  // Handle immediate value updates for reduced motion
  const effectiveDuration = prefersReducedMotion ? 0 : duration;

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = Math.min(100, Math.max(0, value));

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

  const strokeDashoffset = circumference - (displayValue / 100) * circumference;

  return (
    <div
      className={cn('relative', className)}
      style={{ width: size, height: size }}
    >
      <svg
        className="-rotate-90"
        width={size}
        height={size}
        viewBox={viewBox}
      >
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={cn('text-muted', trackClassName)}
        />
        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn('text-primary', progressClassName)}
          style={{
            transition: 'stroke-dashoffset 0.1s ease-out',
          }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

export { type AnimatedProgressProps };
