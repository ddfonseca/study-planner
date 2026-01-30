/**
 * Sortable Subject Item Component
 * Used for drag-and-drop reordering of subjects
 */
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Subject } from '@/types/api';

interface SortableSubjectItemProps {
  subject: Subject;
  children: React.ReactNode;
  disabled?: boolean;
}

export function SortableSubjectItem({
  subject,
  children,
  disabled = false,
}: SortableSubjectItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: subject.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        isDragging && 'opacity-50 z-50'
      )}
    >
      <div className="flex items-center gap-3 p-3 rounded-lg border transition-colors">
        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          disabled={disabled}
          className={cn(
            "touch-none",
            disabled
              ? "cursor-not-allowed text-muted-foreground/30"
              : "cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground"
          )}
        >
          <GripVertical className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

export default SortableSubjectItem;
