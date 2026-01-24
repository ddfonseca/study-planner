/**
 * SessionListSkeleton - Loading skeleton that matches session list layout
 */
import { Skeleton } from '@/components/ui/skeleton';

const DEFAULT_SESSION_COUNT = 3;

interface SessionListSkeletonProps {
  /** Number of session items to display (default: 3) */
  sessionCount?: number;
}

export function SessionListSkeleton({ sessionCount = DEFAULT_SESSION_COUNT }: SessionListSkeletonProps) {
  return (
    <div className="space-y-2 max-h-48 overflow-y-auto" role="list">
      {Array.from({ length: sessionCount }).map((_, index) => (
        <div
          key={index}
          role="listitem"
          className="flex items-center justify-between p-3 rounded-lg bg-muted"
        >
          <div className="flex-1 flex items-center gap-2">
            {/* Subject name skeleton */}
            <Skeleton className="h-4 w-32" />
            {/* Time skeleton (inline with subject) */}
            <Skeleton className="h-4 w-16" />
          </div>
          {/* Delete button skeleton */}
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export default SessionListSkeleton;
