/**
 * Swipeable Session Item - Session item that opens modal on tap (no swipe delete)
 */
import { useCallback } from 'react';
import { formatTime } from '@/lib/utils/time';
import { cn } from '@/lib/utils';
import type { StudySession } from '@/types/session';

interface SwipeableSessionItemProps {
  session: StudySession;
  onEdit: () => void;
  onDelete?: (id: string) => void; // Kept for API compatibility but not used
  canModify?: boolean;
}

export function SwipeableSessionItem({
  session,
  onEdit,
  canModify = true,
}: SwipeableSessionItemProps) {
  const handleClick = useCallback(() => {
    onEdit();
  }, [onEdit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onEdit();
    }
  }, [onEdit]);

  return (
    <div
      className="relative overflow-hidden rounded-lg"
      data-testid="swipeable-session-item"
    >
      <div
        className={cn(
          "flex items-center justify-between p-3 bg-muted/50 min-h-[56px]",
          canModify && "cursor-pointer active:opacity-70"
        )}
        data-testid="session-content"
      >
        <div
          className="flex-1 min-w-0"
          onClick={handleClick}
          role="button"
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          <p className="font-medium text-foreground truncate">
            {session.materia}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatTime(session.minutos)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default SwipeableSessionItem;
