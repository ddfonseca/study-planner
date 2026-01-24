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
 *
 * IMPORTANT: Content is always mounted to prevent remounting issues
 * with components like Chart.js that have their own animations.
 */
export function SkeletonTransition({
  isLoading,
  skeleton,
  children,
  className,
  duration = 300,
}: SkeletonTransitionProps) {
  // Track whether we've ever finished loading
  const [hasLoadedOnce, setHasLoadedOnce] = useState(!isLoading);
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

  const showSkeleton = phase === 'skeleton' || phase === 'transitioning';
  const showContent = phase === 'transitioning' || phase === 'content';
  const isTransitioning = phase === 'transitioning';

  return (
    <div className={cn('relative', className)}>
      {/* Skeleton layer */}
      {showSkeleton && (
        <div
          className={cn(isTransitioning && 'animate-fade-out')}
          style={isTransitioning ? animationStyles : undefined}
        >
          {skeleton}
        </div>
      )}

      {/* Content layer - always mounted once loading completes to prevent remount */}
      <div
        className={cn(
          // Position absolutely during transition, then normal flow after
          isTransitioning && 'absolute inset-0',
          // Fade in animation during transition
          isTransitioning && 'animate-fade-in',
          // Hide completely during skeleton phase (but keep mounted after first load)
          phase === 'skeleton' && hasLoadedOnce && 'invisible'
        )}
        style={isTransitioning ? animationStyles : undefined}
        // Hide from screen readers when not visible
        aria-hidden={phase === 'skeleton'}
      >
        {/* Only render children after first load starts completing, or if already loaded */}
        {(showContent || hasLoadedOnce) && children}
      </div>
    </div>
  );
}
