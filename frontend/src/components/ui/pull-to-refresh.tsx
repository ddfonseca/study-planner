import * as React from 'react';
import { RefreshCw, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  /** Pull distance required to trigger refresh (default: 80px) */
  threshold?: number;
  /** Maximum pull distance (default: 120px) */
  maxPull?: number;
  /** Whether pull-to-refresh is enabled (default: true) */
  enabled?: boolean;
  /** Additional className for the container */
  className?: string;
  /** Text to show when pulling */
  pullText?: string;
  /** Text to show when release will trigger refresh */
  releaseText?: string;
  /** Text to show while refreshing */
  refreshingText?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  maxPull = 120,
  enabled = true,
  className,
  pullText = 'Puxe para atualizar',
  releaseText = 'Solte para atualizar',
  refreshingText = 'Atualizando...',
}: PullToRefreshProps) {
  const { isRefreshing, pullDistance, containerProps } = usePullToRefresh({
    onRefresh,
    threshold,
    maxPull,
    enabled,
  });

  const progress = Math.min(pullDistance / threshold, 1);
  const shouldTrigger = pullDistance >= threshold;
  const showIndicator = pullDistance > 0 || isRefreshing;

  const getText = () => {
    if (isRefreshing) return refreshingText;
    if (shouldTrigger) return releaseText;
    return pullText;
  };

  return (
    <div className={cn('relative', className)} {...containerProps}>
      {/* Pull indicator */}
      <div
        className={cn(
          'absolute left-0 right-0 flex flex-col items-center justify-end overflow-hidden transition-opacity duration-200',
          showIndicator ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          height: isRefreshing ? 60 : pullDistance,
          top: 0,
          transform: 'translateY(-100%)',
          paddingBottom: 8,
        }}
        aria-hidden={!showIndicator}
      >
        <div className="flex flex-col items-center gap-1">
          <div
            className={cn(
              'rounded-full bg-secondary p-2 transition-transform duration-200',
              shouldTrigger && !isRefreshing && 'scale-110'
            )}
            style={{
              transform: isRefreshing
                ? 'rotate(0deg)'
                : `rotate(${progress * 180}deg)`,
            }}
          >
            {isRefreshing ? (
              <RefreshCw className="h-5 w-5 text-primary animate-spin" />
            ) : (
              <ArrowDown
                className={cn(
                  'h-5 w-5 transition-colors duration-200',
                  shouldTrigger ? 'text-primary' : 'text-muted-foreground'
                )}
              />
            )}
          </div>
          <span
            className={cn(
              'text-xs font-medium transition-colors duration-200',
              shouldTrigger || isRefreshing
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          >
            {getText()}
          </span>
        </div>
      </div>

      {/* Content container with pull translation */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform:
            pullDistance > 0 || isRefreshing
              ? `translateY(${isRefreshing ? 60 : pullDistance}px)`
              : 'translateY(0)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default PullToRefresh;
