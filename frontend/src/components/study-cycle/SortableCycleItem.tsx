/**
 * Sortable Cycle Item Component
 * Used for drag-and-drop reordering of cycle items
 */
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SortableCycleItemProps {
  id: string;
  index: number;
  subjectName: string;
  duration: string;
  onRemove: () => void;
}

export function SortableCycleItem({
  id,
  index,
  subjectName,
  duration,
  onRemove,
}: SortableCycleItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 bg-muted rounded-lg",
        isDragging && "opacity-50 z-50 shadow-lg"
      )}
    >
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span className="text-xs text-muted-foreground w-5">
        {index + 1}.
      </span>
      <span className="flex-1 text-sm font-medium truncate">
        {subjectName}
      </span>
      <span className="text-xs text-muted-foreground">
        {duration}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-destructive hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

export default SortableCycleItem;
