/**
 * Session Modal - Add/view study sessions for a specific day
 */
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDateDisplay } from '@/lib/utils/date';
import { formatTime } from '@/lib/utils/time';
import { Trash2, Plus, Loader2, Clock } from 'lucide-react';
import type { DayData } from '@/types/session';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  dayData: DayData;
  onAddSession: (subject: string, minutes: number) => Promise<void>;
  onDeleteSession: (id: string) => Promise<void>;
}

export function SessionModal({
  isOpen,
  onClose,
  date,
  dayData,
  onAddSession,
  onDeleteSession,
}: SessionModalProps) {
  const [subject, setSubject] = useState('');
  const [minutes, setMinutes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !minutes) return;

    setIsSubmitting(true);
    try {
      await onAddSession(subject.trim(), parseInt(minutes, 10));
      setSubject('');
      setMinutes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      await onDeleteSession(id);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!date) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {formatDateDisplay(date)}
          </DialogTitle>
          <DialogDescription>
            Total do dia:{' '}
            <span className="font-medium text-text">
              {formatTime(dayData.totalMinutos)}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Add session form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Matéria</Label>
              <Input
                id="subject"
                placeholder="Ex: Matemática"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
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
          <Button
            type="submit"
            disabled={!subject.trim() || !minutes || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Adicionar Sessão
          </Button>
        </form>

        {/* Sessions list */}
        {dayData.materias.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-text-light">Sessões do dia:</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {dayData.materias.map((materia) => (
                <div
                  key={materia.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <span className="font-medium text-text">{materia.materia}</span>
                    <span className="text-sm text-text-light ml-2">
                      {formatTime(materia.minutos)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(materia.id)}
                    disabled={isSubmitting}
                    className="text-danger hover:text-danger hover:bg-danger/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {dayData.materias.length === 0 && (
          <p className="text-center text-text-lighter py-4">
            Nenhuma sessão registrada neste dia
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default SessionModal;
