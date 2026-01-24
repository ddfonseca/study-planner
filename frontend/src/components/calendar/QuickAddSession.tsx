/**
 * Quick Add Session - Inline form to add a study session for today
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubjectPicker } from '@/components/ui/subject-picker';
import { useRecentSubjects } from '@/hooks/useRecentSubjects';
import { Plus, Loader2 } from 'lucide-react';

interface QuickAddSessionProps {
  subjects: string[];
  onAddSession: (subject: string, minutes: number) => Promise<void>;
  canModify?: boolean;
}

export function QuickAddSession({
  subjects,
  onAddSession,
  canModify = true,
}: QuickAddSessionProps) {
  const [subject, setSubject] = useState('');
  const [minutes, setMinutes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { recentSubjects, addRecentSubject } = useRecentSubjects();

  // Show message when in "all" mode
  if (!canModify) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Adicionar Estudo de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Selecione um workspace para adicionar sessões.
          </p>
        </CardContent>
      </Card>
    );
  }

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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Adicionar Estudo de Hoje
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="quick-subject" className="text-xs">
              Matéria
            </Label>
            <SubjectPicker
              value={subject}
              onValueChange={setSubject}
              subjects={subjects}
              recentSubjects={recentSubjects}
              onSubjectUsed={addRecentSubject}
              placeholder="Selecione..."
              searchPlaceholder="Buscar..."
              emptyMessage="Nenhuma matéria"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="quick-minutes" className="text-xs">
              Minutos
            </Label>
            <Input
              id="quick-minutes"
              type="number"
              placeholder="Ex: 60"
              min="1"
              max="1440"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <Button
            type="submit"
            disabled={!subject.trim() || !minutes || isSubmitting}
            className="w-full"
            aria-busy={isSubmitting}
            aria-label="Adicionar sessão de estudo"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
            ) : (
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            )}
            Adicionar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default QuickAddSession;
