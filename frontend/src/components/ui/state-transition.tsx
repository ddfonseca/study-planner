import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type TransitionState = 'entering' | 'entered' | 'exiting' | 'exited';

interface StateTransitionProps {
  /** Whether the content should be visible */
  show: boolean;
  /** The content to animate */
  children: ReactNode;
  /** Duration of enter animation in ms (default: 300) */
  enterDuration?: number;
  /** Duration of exit animation in ms (default: 200) */
  exitDuration?: number;
  /** Animation type */
  animation?: 'fade' | 'slide-down' | 'slide-up' | 'scale' | 'fade-scale';
  /** Whether to unmount when hidden (default: true) */
  unmountOnExit?: boolean;
  /** Additional className for the wrapper */
  className?: string;
  /** Callback when enter animation completes */
  onEntered?: () => void;
  /** Callback when exit animation completes */
  onExited?: () => void;
}

const animationStyles: Record<string, { enter: string; exit: string; base: string }> = {
  'fade': {
    base: 'transition-opacity',
    enter: 'opacity-100',
    exit: 'opacity-0',
  },
  'slide-down': {
    base: 'transition-all',
    enter: 'opacity-100 translate-y-0',
    exit: 'opacity-0 -translate-y-2',
  },
  'slide-up': {
    base: 'transition-all',
    enter: 'opacity-100 translate-y-0',
    exit: 'opacity-0 translate-y-2',
  },
  'scale': {
    base: 'transition-all',
    enter: 'opacity-100 scale-100',
    exit: 'opacity-0 scale-95',
  },
  'fade-scale': {
    base: 'transition-all',
    enter: 'opacity-100 scale-100',
    exit: 'opacity-0 scale-95',
  },
};

/**
 * StateTransition provides smooth enter/exit animations for content
 * that changes visibility based on state.
 *
 * Perfect for:
 * - Banners that appear/disappear (offline, notifications)
 * - Conditional content (errors, success messages)
 * - Toggle-based UI elements
 */
export function StateTransition({
  show,
  children,
  enterDuration = 300,
  exitDuration = 200,
  animation = 'fade',
  unmountOnExit = true,
  className,
  onEntered,
  onExited,
}: StateTransitionProps) {
  // Track transition state
  const [state, setState] = useState<TransitionState>(show ? 'entering' : 'exited');
  const [shouldRender, setShouldRender] = useState(show);
  // Track previous show value to detect changes
  const [prevShow, setPrevShow] = useState(show);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Detect when show changes and update state during render (React recommended pattern)
  if (show !== prevShow) {
    setPrevShow(show);
    if (show) {
      // Show changed to true - mount and start entering
      setShouldRender(true);
      setState('entering');
    } else {
      // Show changed to false - start exiting
      setState('exiting');
    }
  }

  // Handle animation timing with timeouts in effects
  useEffect(() => {
    if (state !== 'entering') return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Wait for enter duration then transition to entered
    timeoutRef.current = setTimeout(() => {
      setState('entered');
      onEntered?.();
    }, enterDuration);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state, enterDuration, onEntered]);

  useEffect(() => {
    if (state !== 'exiting') return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Wait for exit duration then transition to exited
    timeoutRef.current = setTimeout(() => {
      setState('exited');
      if (unmountOnExit) {
        setShouldRender(false);
      }
      onExited?.();
    }, exitDuration);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state, exitDuration, unmountOnExit, onExited]);

  // Derive animation duration
  const transitionStyles = useMemo(() => ({
    transitionDuration: `${state === 'entering' || state === 'entered' ? enterDuration : exitDuration}ms`,
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  }), [state, enterDuration, exitDuration]);

  if (!shouldRender && unmountOnExit) {
    return null;
  }

  const styles = animationStyles[animation];
  const isVisible = state === 'entering' || state === 'entered';

  return (
    <div
      className={cn(
        styles.base,
        isVisible ? styles.enter : styles.exit,
        className
      )}
      style={transitionStyles}
      aria-hidden={!isVisible}
    >
      {children}
    </div>
  );
}

export { type StateTransitionProps, type TransitionState };
