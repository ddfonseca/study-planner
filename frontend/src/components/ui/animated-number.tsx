import { useState, useEffect, useRef } from 'react';

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
 * AnimatedNumber smoothly transitions between numeric values.
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
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const startTime = performance.now();

    // Don't animate if values are the same
    if (startValue === endValue) {
      return;
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function: ease-out cubic
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
  }, [value, duration]);

  const formattedValue = format
    ? format(displayValue)
    : displayValue.toFixed(decimals);

  return <span className={className}>{formattedValue}</span>;
}

export { type AnimatedNumberProps };
