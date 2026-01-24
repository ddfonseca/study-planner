import { useState, useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type AchievementVariant = 'gold' | 'silver' | 'bronze' | 'default';

interface AchievementBadgeProps {
  /** Whether the badge should be shown with animation */
  show: boolean;
  /** The content of the badge (icon, text, etc.) */
  children: ReactNode;
  /** Badge variant for different achievement levels */
  variant?: AchievementVariant;
  /** Badge title/label */
  title?: string;
  /** Optional description */
  description?: string;
  /** Duration of the entrance animation in ms (default: 600) */
  animationDuration?: number;
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
  /** Additional className for the wrapper */
  className?: string;
}

const variantStyles: Record<AchievementVariant, string> = {
  gold: 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900 border-yellow-500',
  silver: 'bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900 border-gray-400',
  bronze: 'bg-gradient-to-br from-orange-400 to-orange-600 text-orange-900 border-orange-500',
  default: 'bg-gradient-to-br from-primary to-primary-dark text-primary-foreground border-primary',
};

/**
 * AchievementBadge component for displaying achievement unlocks with animation.
 *
 * Features:
 * - Smooth entrance animation with scale and glow effects
 * - GPU-accelerated CSS transitions for 60fps performance
 * - Respects prefers-reduced-motion for accessibility
 * - Multiple variants for different achievement tiers
 *
 * Perfect for:
 * - Displaying earned achievements
 * - Celebrating milestones
 * - Reward notifications
 */
export function AchievementBadge({
  show,
  children,
  variant = 'default',
  title,
  description,
  animationDuration = 600,
  onAnimationComplete,
  className,
}: AchievementBadgeProps) {
  const prefersReducedMotion = useReducedMotion();
  const [animationState, setAnimationState] = useState<'hidden' | 'entering' | 'visible'>(
    show ? 'entering' : 'hidden'
  );
  const [shouldRender, setShouldRender] = useState(show);
  const [prevShow, setPrevShow] = useState(show);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onCompleteRef = useRef(onAnimationComplete);

  // Keep callback ref up to date
  useEffect(() => {
    onCompleteRef.current = onAnimationComplete;
  }, [onAnimationComplete]);

  // Detect when show changes and update state during render (React recommended pattern)
  if (show !== prevShow) {
    setPrevShow(show);
    if (show) {
      setShouldRender(true);
      setAnimationState('entering');
    } else {
      setAnimationState('hidden');
      setShouldRender(false);
    }
  }

  // Use reduced duration if user prefers reduced motion
  const effectiveDuration = prefersReducedMotion ? 0 : animationDuration;

  // Handle animation timing with timeout in effect
  useEffect(() => {
    if (animationState !== 'entering') return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Transition to visible after animation
    timeoutRef.current = setTimeout(() => {
      setAnimationState('visible');
      onCompleteRef.current?.();
    }, effectiveDuration);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [animationState, effectiveDuration]);

  if (!shouldRender) {
    return null;
  }

  const isAnimating = animationState === 'entering';

  return (
    <div
      className={cn(
        'inline-flex flex-col items-center gap-2',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={title ? `Achievement unlocked: ${title}` : 'Achievement unlocked'}
    >
      {/* Badge circle with animation */}
      <div
        className={cn(
          'relative flex items-center justify-center',
          'w-16 h-16 rounded-full border-2',
          'transform-gpu will-change-transform',
          variantStyles[variant],
          // Animation classes
          isAnimating && !prefersReducedMotion && 'animate-achievement-enter',
          !isAnimating && 'scale-100 opacity-100'
        )}
        style={{
          animationDuration: `${effectiveDuration}ms`,
        }}
      >
        {/* Glow effect */}
        {isAnimating && !prefersReducedMotion && (
          <div
            className={cn(
              'absolute inset-0 rounded-full',
              'animate-achievement-glow',
              variant === 'gold' && 'bg-yellow-400',
              variant === 'silver' && 'bg-gray-300',
              variant === 'bronze' && 'bg-orange-400',
              variant === 'default' && 'bg-primary'
            )}
            style={{
              animationDuration: `${effectiveDuration}ms`,
            }}
            aria-hidden="true"
          />
        )}

        {/* Badge content */}
        <div className="relative z-10 text-2xl">
          {children}
        </div>
      </div>

      {/* Title and description */}
      {(title || description) && (
        <div
          className={cn(
            'text-center',
            isAnimating && !prefersReducedMotion && 'animate-fade-in'
          )}
          style={{
            animationDuration: `${effectiveDuration}ms`,
            animationDelay: `${effectiveDuration * 0.3}ms`,
          }}
        >
          {title && (
            <p className="font-semibold text-foreground text-sm">{title}</p>
          )}
          {description && (
            <p className="text-muted-foreground text-xs">{description}</p>
          )}
        </div>
      )}
    </div>
  );
}

export type { AchievementBadgeProps, AchievementVariant };
