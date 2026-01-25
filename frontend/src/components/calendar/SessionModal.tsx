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
import { SubjectPicker } from '@/components/ui/subject-picker';
import { useRecentSubjects } from '@/hooks/useRecentSubjects';
import { formatDateDisplay } from '@/lib/utils/date';
import { formatTime } from '@/lib/utils/time';
import { Trash2, Plus, Loader2, Clock, Pencil, X } from 'lucide-react';
import type { DayData, StudySession } from '@/types/session';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  dayData: DayData;
  subjects: string[];
  onAddSession: (subject: string, minutes: number) => Promise<void>;
  onUpdateSession: (id: string, subject: string, minutes: number) => Promise<void>;
  onDeleteSession: (id: string) => Promise<void>;
  canModify?: boolean;
  highlighted?: boolean;
}

export function SessionModal({
  isOpen,
  onClose,
  date,
  dayData,
  subjects,
  onAddSession,
  onUpdateSession,
  onDeleteSession,
  canModify = true,
  highlighted = false,
}: SessionModalProps) {
  const [subject, setSubject] = useState('');
  const [minutes, setMinutes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { recentSubjects, addRecentSubject } = useRecentSubjects();

  const isEditing = editingSession !== null;

  const handleStartEdit = (session: StudySession) => {
    setEditingSession(session);
    setSubject(session.materia);
    setMinutes(session.minutos.toString());
  };

  const handleCancelEdit = () => {
    setEditingSession(null);
    setSubject('');
    setMinutes('');
  };

  // Reset state when modal closes
  const handleClose = () => {
    handleCancelEdit();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !minutes) return;

    setIsSubmitting(true);
    try {
      if (isEditing && editingSession) {
        await onUpdateSession(editingSession.id, subject.trim(), parseInt(minutes, 10));
        setEditingSession(null);
      } else {
        await onAddSession(subject.trim(), parseInt(minutes, 10));
      }
      setSubject('');
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
            Total do dia:{' '}
            <span className="font-medium text-foreground">
              {formatTime(dayData.totalMinutos)}
            </span>
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        {/* Add session form */}
        {canModify ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Matéria</Label>
                <SubjectPicker
                  value={subject}
                  onValueChange={setSubject}
                  subjects={subjects}
                  recentSubjects={recentSubjects}
                  onSubjectUsed={addRecentSubject}
                  placeholder="Selecione ou digite..."
                  searchPlaceholder="Buscar matéria..."
                  emptyMessage="Nenhuma matéria encontrada"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minutes">Minutos</Label>
                <Input
                  id="minutes"
                  type="number"
                  placeholder="Ex: 60"
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
                  Cancelar
                </Button>
              )}
              <Button
                type="submit"
                disabled={!subject.trim() || !minutes || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : isEditing ? (
                  <Pencil className="h-4 w-4 mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {isEditing ? 'Atualizar' : 'Adicionar'}
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-amber-600 dark:text-amber-400 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
            Selecione um workspace para adicionar ou editar sessões.
          </p>
        )}

        {/* Sessions list */}
        {dayData.materias.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Sessões do dia:{' '}
              {canModify && <span className="text-xs">(clique para editar)</span>}
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto" role="list">
              {dayData.materias.map((materia) => (
                <div
                  key={materia.id}
                  onClick={() => canModify && handleStartEdit(materia)}
                  onKeyDown={(e) => {
                    if (!canModify) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleStartEdit(materia);
                    }
                  }}
                  role={canModify ? 'button' : 'listitem'}
                  tabIndex={canModify ? 0 : undefined}
                  aria-label={canModify ? `Editar sessão: ${materia.materia}, ${formatTime(materia.minutos)}` : undefined}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border-2 ${
                    canModify ? 'cursor-pointer' : 'cursor-default'
                  } ${
                    editingSession?.id === materia.id
                      ? 'bg-primary/20 border-primary'
                      : canModify
                        ? 'bg-muted hover:bg-muted/80 border-transparent'
                        : 'bg-muted border-transparent'
                  }`}
                >
                  <div className="flex-1">
                    <span className="font-medium text-foreground">{materia.materia}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {formatTime(materia.minutos)}
                    </span>
                  </div>
                  {canModify && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(materia.id);
                      }}
                      disabled={isSubmitting}
                      className="text-danger hover:text-danger hover:bg-danger/10"
                      aria-label={`Excluir sessão: ${materia.materia}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {dayData.materias.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            Nenhuma sessão registrada neste dia
          </p>
        )}
      </ResponsiveDialogContent>

      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        title="Excluir sessão?"
        description="Esta ação não pode ser desfeita."
        confirmText="Excluir"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        isLoading={isSubmitting}
      />
    </ResponsiveDialog>
  );
}

export default SessionModal;
