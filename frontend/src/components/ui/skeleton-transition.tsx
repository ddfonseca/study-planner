import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SkeletonTransitionProps {
  /** Whether the content is still loading */
  isLoading: boolean;
  /** The skeleton component to show while loading */
  skeleton: ReactNode;
  /** The actual content to show after loading */
  children: ReactNode;
  /** Additional className for the wrapper */
  className?: string;
  /** Duration of the fade transition in ms (default: 300) */
  duration?: number;
}

type TransitionPhase = 'skeleton' | 'transitioning' | 'content';

/**
 * SkeletonTransition provides smooth fade transitions between
 * skeleton loading states and actual content.
 *
 * The skeleton fades out while the content fades in, creating
 * a polished loading experience.
 */
export function SkeletonTransition({
  isLoading,
  skeleton,
  children,
  className,
  duration = 300,
}: SkeletonTransitionProps) {
  // Track whether we've ever finished loading
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  // Track the current phase of transition
  const [phase, setPhase] = useState<TransitionPhase>(isLoading ? 'skeleton' : 'content');
  // Track the previous isLoading value to detect changes
  const [prevIsLoading, setPrevIsLoading] = useState(isLoading);

  // Detect when isLoading changes from true to false (loading complete)
  if (isLoading !== prevIsLoading) {
    setPrevIsLoading(isLoading);
    if (!isLoading && prevIsLoading) {
      // Loading just finished - start transition
      setPhase('transitioning');
    } else if (isLoading && !prevIsLoading) {
      // Started loading again
      setPhase('skeleton');
    }
  }

  // Handle transition timing
  useEffect(() => {
    if (phase !== 'transitioning') return;

    const timer = setTimeout(() => {
      setPhase('content');
      setHasLoadedOnce(true);
    }, duration);

    return () => clearTimeout(timer);
  }, [phase, duration]);

  // Derive animation classes based on current phase
  const animationStyles = useMemo(() => ({
    animationDuration: `${duration}ms`,
  }), [duration]);

  // Initial loading state - no animation
  if (phase === 'skeleton' && !hasLoadedOnce) {
    return <div className={className}>{skeleton}</div>;
  }

  // Re-loading after having loaded before
  if (phase === 'skeleton' && hasLoadedOnce) {
    return <div className={className}>{skeleton}</div>;
  }

  // Transitioning - show both with fade animations
  if (phase === 'transitioning') {
    return (
      <div className={cn('relative', className)}>
        <div className="animate-fade-out" style={animationStyles}>
          {skeleton}
        </div>
        <div className="absolute inset-0 animate-fade-in" style={animationStyles}>
          {children}
        </div>
      </div>
    );
  }

  // Content phase - show content with fade-in on first load
  return (
    <div
      className={cn(
        !hasLoadedOnce && 'animate-fade-in',
        className
      )}
      style={!hasLoadedOnce ? animationStyles : undefined}
    >
      {children}
    </div>
  );
}
