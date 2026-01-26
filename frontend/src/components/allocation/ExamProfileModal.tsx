import { useState, useEffect } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { SubjectProfileRow } from './SubjectProfileRow';
import type { ExamProfile, CreateExamProfileDto, CreateSubjectProfileDto } from '@/types/api';

interface ExamProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: ExamProfile | null;
  workspaceId: string;
  onSave: (data: CreateExamProfileDto) => Promise<void>;
}

const emptySubject = (): CreateSubjectProfileDto => ({
  subject: '',
  weight: 1.0,
  currentLevel: 5,
  goalLevel: 8,
  position: 0,
});

export function ExamProfileModal({ open, onOpenChange, profile, workspaceId, onSave }: ExamProfileModalProps) {
  const [name, setName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [weeklyHours, setWeeklyHours] = useState(30);
  const [subjects, setSubjects] = useState<CreateSubjectProfileDto[]>([emptySubject()]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setExamDate(profile.examDate?.split('T')[0] || '');
      setWeeklyHours(profile.weeklyHours);
      setSubjects(profile.subjects.map(s => ({
        subject: s.subject,
        weight: s.weight,
        currentLevel: s.currentLevel,
        goalLevel: s.goalLevel,
        position: s.position,
      })));
    } else {
      setName('');
      setExamDate('');
      setWeeklyHours(30);
      setSubjects([emptySubject()]);
    }
  }, [profile, open]);

  const handleAddSubject = () => {
    setSubjects([...subjects, { ...emptySubject(), position: subjects.length }]);
  };

  const handleUpdateSubject = (index: number, updated: CreateSubjectProfileDto) => {
    const newSubjects = [...subjects];
    newSubjects[index] = updated;
    setSubjects(newSubjects);
  };

  const handleDeleteSubject = (index: number) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter((_, i) => i !== index).map((s, i) => ({ ...s, position: i })));
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !examDate || subjects.length === 0) return;

    setIsSubmitting(true);
    try {
      await onSave({
        workspaceId,
        name: name.trim(),
        examDate,
        weeklyHours,
        subjects: subjects.map((s, i) => ({ ...s, position: i })),
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-2xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{profile ? 'Editar Perfil' : 'Novo Perfil de Concurso'}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {profile ? 'Atualize as informações do perfil.' : 'Configure o concurso e suas disciplinas.'}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do concurso</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: TRF5 2025"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="examDate">Data da prova <span className="text-destructive">*</span></Label>
              <Input
                id="examDate"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weeklyHours">Horas semanais disponíveis</Label>
            <Input
              id="weeklyHours"
              type="number"
              min={1}
              max={168}
              value={weeklyHours}
              onChange={(e) => {
                const value = e.target.value.replace(/^0+(?=\d)/, '');
                const parsed = parseInt(value, 10);
                if (isNaN(parsed) || parsed < 1) {
                  setWeeklyHours(1);
                } else if (parsed > 168) {
                  setWeeklyHours(168);
                } else {
                  setWeeklyHours(parsed);
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Disciplinas</Label>
            {/* Header row */}
            <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
              <span className="flex-1 min-w-0">Nome</span>
              <span className="w-16 text-center">Peso</span>
              <span className="w-16 text-center">Atual</span>
              <span className="w-16 text-center">Meta</span>
              <span className="w-8" />
            </div>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
              {subjects.map((subject, index) => (
                <SubjectProfileRow
                  key={index}
                  subject={subject}
                  onChange={(updated) => handleUpdateSubject(index, updated)}
                  onDelete={() => handleDeleteSubject(index)}
                />
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={handleAddSubject}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar disciplina
            </Button>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !name.trim() || !examDate || subjects.length === 0} className="flex-1">
            {isSubmitting ? 'Salvando...' : profile ? 'Salvar' : 'Criar'}
          </Button>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
