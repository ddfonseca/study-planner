/**
 * Session Modal - Add/view study sessions for a specific day
 */
import { useState } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TaskPicker } from '@/components/ui/task-picker';
import { useRecentTasks } from '@/hooks/useRecentTasks';
import { formatDateDisplay } from '@/lib/utils/date';
import { formatTime } from '@/lib/utils/time';
import { Trash2, Plus, Loader2, Clock, Pencil, X } from 'lucide-react';
import type { DayData, WorkSessionUI } from '@/types/session';
import type { Task, Project } from '@/types/api';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  dayData: DayData;
  subjects: Task[];
  disciplines?: Project[];
  onAddSession: (subjectId: string, minutes: number) => Promise<void>;
  onUpdateSession: (id: string, subjectId: string, minutes: number) => Promise<void>;
  onDeleteSession: (id: string) => Promise<void>;
  onCreateTask?: (data: { name: string; disciplineId?: string }) => Promise<Task>;
  canModify?: boolean;
  highlighted?: boolean;
}

export function SessionModal({
  isOpen,
  onClose,
  date,
  dayData,
  subjects,
  disciplines,
  onAddSession,
  onUpdateSession,
  onDeleteSession,
  onCreateTask,
  canModify = true,
  highlighted = false,
}: SessionModalProps) {
  const [subjectId, setSubjectId] = useState('');
  const [minutes, setMinutes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSession, setEditingSession] = useState<WorkSessionUI | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { recentTasks, addRecentTask } = useRecentTasks();

  const isEditing = editingSession !== null;

  // Find task by name for editing (session.taskName is the name)
  const findTaskIdByName = (name: string): string => {
    const subject = subjects.find(s => s.name === name);
    return subject?.id || '';
  };

  const handleStartEdit = (session: WorkSessionUI) => {
    setEditingSession(session);
    // Session stores task name, convert to ID
    setSubjectId(session.taskId || findTaskIdByName(session.taskName));
    setMinutes(session.minutes.toString());
  };

  const handleCancelEdit = () => {
    setEditingSession(null);
    setSubjectId('');
    setMinutes('');
  };

  // Reset state when modal closes
  const handleClose = () => {
    handleCancelEdit();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !minutes) return;

    setIsSubmitting(true);
    try {
      if (isEditing && editingSession) {
        await onUpdateSession(editingSession.id, subjectId, parseInt(minutes, 10));
        setEditingSession(null);
      } else {
        await onAddSession(subjectId, parseInt(minutes, 10));
      }
      setSubjectId('');
      setMinutes('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    setIsSubmitting(true);
    try {
      await onDeleteSession(deleteConfirmId);
      setDeleteConfirmId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!date) return null;

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <ResponsiveDialogContent
        className={`sm:max-w-md ${highlighted ? 'ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse-once' : ''}`}
      >
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {formatDateDisplay(date)}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Day total:{' '}
            <span className="font-medium text-foreground">
              {formatTime(dayData.totalMinutes)}
            </span>
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        {/* Add session form */}
        {canModify ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Task</Label>
                <TaskPicker
                  value={subjectId}
                  onValueChange={setSubjectId}
                  subjects={subjects}
                  projects={disciplines}
                  recentTasks={recentTasks}
                  onTaskUsed={addRecentTask}
                  onCreateTask={onCreateTask}
                  placeholder="Select or type..."
                  searchPlaceholder="Search task..."
                  emptyMessage="No tasks found"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minutes">Minutes</Label>
                <Input
                  id="minutes"
                  type="number"
                  placeholder="e.g. 60"
                  min="1"
                  max="1440"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={!subjectId || !minutes || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : isEditing ? (
                  <Pencil className="h-4 w-4 mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {isEditing ? 'Update' : 'Add'}
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-amber-600 dark:text-amber-400 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
            Select a workspace to add or edit sessions.
          </p>
        )}

        {/* Sessions list */}
        {dayData.entries.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Day sessions:{' '}
              {canModify && <span className="text-xs">(click to edit)</span>}
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto" role="list">
              {dayData.entries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => canModify && handleStartEdit(entry)}
                  onKeyDown={(e) => {
                    if (!canModify) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleStartEdit(entry);
                    }
                  }}
                  role={canModify ? 'button' : 'listitem'}
                  tabIndex={canModify ? 0 : undefined}
                  aria-label={canModify ? `Edit session: ${entry.taskName}, ${formatTime(entry.minutes)}` : undefined}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border-2 ${
                    canModify ? 'cursor-pointer' : 'cursor-default'
                  } ${
                    editingSession?.id === entry.id
                      ? 'bg-primary/20 border-primary'
                      : canModify
                        ? 'bg-muted hover:bg-muted/80 border-transparent'
                        : 'bg-muted border-transparent'
                  }`}
                >
                  <div className="flex-1">
                    <span className="font-medium text-foreground">{entry.taskName}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {formatTime(entry.minutes)}
                    </span>
                  </div>
                  {canModify && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(entry.id);
                      }}
                      disabled={isSubmitting}
                      className="text-danger hover:text-danger hover:bg-danger/10"
                      aria-label={`Delete session: ${entry.taskName}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {dayData.entries.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            No sessions recorded for this day
          </p>
        )}
      </ResponsiveDialogContent>

      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        title="Delete session?"
        description="This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        isLoading={isSubmitting}
      />
    </ResponsiveDialog>
  );
}

export default SessionModal;
