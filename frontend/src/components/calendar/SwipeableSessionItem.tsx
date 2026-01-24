/**
 * Swipeable Session Item - Session item with swipe-to-reveal delete action
 */
import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { formatTime } from '@/lib/utils/time';
import { cn } from '@/lib/utils';
import type { StudySession } from '@/types/session';

interface SwipeableSessionItemProps {
  session: StudySession;
  onEdit: () => void;
  onDelete: (id: string) => void;
  canModify?: boolean;
}

interface TouchState {
  startX: number;
  startY: number;
  currentX: number;
  isDragging: boolean;
}

const DELETE_BUTTON_WIDTH = 72; // Width of the delete action area
const SWIPE_THRESHOLD = 40; // Minimum swipe distance to reveal delete

export function SwipeableSessionItem({
  session,
  onEdit,
  onDelete,
  canModify = true,
}: SwipeableSessionItemProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const touchState = useRef<TouchState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!canModify) return;

    const touch = e.touches[0];
    touchState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      isDragging: false,
    };
  }, [canModify]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchState.current || !canModify) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchState.current.startX;
    const deltaY = touch.clientY - touchState.current.startY;

    // If not yet dragging, check if this is a horizontal swipe
    if (!touchState.current.isDragging) {
      // Ignore if vertical movement is greater (user is scrolling)
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
        touchState.current = null;
        return;
      }
      // Start dragging if horizontal movement exceeds threshold
      if (Math.abs(deltaX) > 10) {
        touchState.current.isDragging = true;
        setIsDragging(true);
      }
    }

    if (touchState.current.isDragging) {
      touchState.current.currentX = touch.clientX;

      // Calculate new position based on whether already revealed
      const basePosition = isRevealed ? -DELETE_BUTTON_WIDTH : 0;
      let newTranslateX = basePosition + deltaX;

      // Limit the swipe range
      newTranslateX = Math.max(-DELETE_BUTTON_WIDTH, Math.min(0, newTranslateX));

      setTranslateX(newTranslateX);
    }
  }, [canModify, isRevealed]);

  const handleTouchEnd = useCallback(() => {
    if (!touchState.current || !canModify) return;

    const deltaX = touchState.current.currentX - touchState.current.startX;

    if (touchState.current.isDragging) {
      // Determine final state based on swipe direction and threshold
      if (isRevealed) {
        // If already revealed, swipe right to close
        if (deltaX > SWIPE_THRESHOLD) {
          setTranslateX(0);
          setIsRevealed(false);
        } else {
          setTranslateX(-DELETE_BUTTON_WIDTH);
        }
      } else {
        // If not revealed, swipe left to reveal
        if (deltaX < -SWIPE_THRESHOLD) {
          setTranslateX(-DELETE_BUTTON_WIDTH);
          setIsRevealed(true);
        } else {
          setTranslateX(0);
        }
      }
    }

    touchState.current = null;
    setIsDragging(false);
  }, [canModify, isRevealed]);

  const handleDelete = useCallback(() => {
    // Reset swipe state before deleting
    setTranslateX(0);
    setIsRevealed(false);
    onDelete(session.id);
  }, [onDelete, session.id]);

  const handleContentClick = useCallback(() => {
    if (!canModify) return;

    // If revealed, close it; otherwise trigger edit
    if (isRevealed) {
      setTranslateX(0);
      setIsRevealed(false);
    } else {
      onEdit();
    }
  }, [canModify, isRevealed, onEdit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!canModify) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleContentClick();
    }
  }, [canModify, handleContentClick]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-lg"
      data-testid="swipeable-session-item"
    >
      {/* Delete action background (revealed on swipe) */}
      {canModify && (
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-center bg-destructive"
          style={{ width: DELETE_BUTTON_WIDTH }}
          data-testid="delete-action"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="h-full w-full text-destructive-foreground hover:bg-destructive/90 rounded-none"
            aria-label="Excluir sessão"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Main content (slides to reveal delete) */}
      <div
        className={cn(
          "flex items-center justify-between p-3 bg-muted/50 min-h-[56px] touch-no-select",
          "transition-transform duration-200 ease-out",
          isDragging && "transition-none"
        )}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-testid="session-content"
      >
        <div
          className={cn(
            "flex-1 min-w-0 touch-action-manipulation",
            canModify && "cursor-pointer active:opacity-70"
          )}
          onClick={handleContentClick}
          role={canModify ? "button" : undefined}
          tabIndex={canModify ? 0 : undefined}
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
