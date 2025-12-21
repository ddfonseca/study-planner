/**
 * Weekly Goal Editor - Modal for editing weekly goals
 */
import { useState, useEffect } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWeeklyGoals } from '@/hooks/useWeeklyGoals';
import { formatTime } from '@/lib/utils/time';
import type { WeeklyGoal } from '@/types/api';

interface WeeklyGoalEditorProps {
  isOpen: boolean;
  onClose: () => void;
  weekStart: Date;
  currentTotal: number; // Total minutes for the week
}

export function WeeklyGoalEditor({
  isOpen,
  onClose,
  weekStart,
  currentTotal,
}: WeeklyGoalEditorProps) {
  const { getGoalForWeek, updateGoal, canEditWeek, isLoading } = useWeeklyGoals();
  const [goal, setGoal] = useState<WeeklyGoal | null>(null);
  const [targetHours, setTargetHours] = useState<string>('30');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const canEdit = canEditWeek(weekStart);

  // Format date range for display
  const weekStartStr = weekStart.toISOString().split('T')[0];
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
  });
  const weekStartDisplay = weekStart.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
  });

  useEffect(() => {
    if (isOpen) {
      loadGoal();
    }
  }, [isOpen, weekStartStr]);

  const loadGoal = async () => {
    try {
      setError(null);
      const loadedGoal = await getGoalForWeek(weekStart);
      setGoal(loadedGoal);
      setTargetHours(String(loadedGoal.targetHours));
    } catch {
      setError('Erro ao carregar meta');
    }
  };

  const handleSave = async () => {
    const targetValue = parseFloat(targetHours) || 0;

    if (targetValue < 0) {
      setError('Meta deve ser maior ou igual a 0');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await updateGoal(weekStart, { targetHours: targetValue });
      onClose();
    } catch (err) {
      if (err instanceof Error && err.message.includes('past')) {
        setError('Não é possível editar metas de semanas passadas');
      } else {
        setError('Erro ao salvar meta');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const totalHours = currentTotal / 60;
  const progress = goal ? Math.min(100, (totalHours / goal.targetHours) * 100) : 0;
  const achieved = goal && totalHours >= goal.targetHours;

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ResponsiveDialogContent className="sm:max-w-[400px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            Meta da Semana
            <span className="block text-sm font-normal text-muted-foreground">
              {weekStartDisplay} - {weekEndStr}
            </span>
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <div className="space-y-4 py-4">
          {/* Current progress */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Progresso</span>
              <span className="text-lg font-semibold">{formatTime(currentTotal)}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  achieved ? 'bg-primary' : 'bg-gray-400'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {goal && (
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0h</span>
                <span className={achieved ? 'text-primary font-medium' : ''}>
                  {goal.targetHours}h
                </span>
              </div>
            )}
          </div>

          {/* Goal input */}
          <div className="space-y-2">
            <Label htmlFor="targetHours">
              Meta Semanal (horas)
            </Label>
            <Input
              id="targetHours"
              type="number"
              min="0"
              step="0.5"
              value={targetHours}
              onChange={(e) => setTargetHours(e.target.value)}
              disabled={!canEdit || isLoading || isSaving}
            />
          </div>

          {goal?.isCustom && (
            <p className="text-xs text-muted-foreground">
              Esta meta foi personalizada para esta semana.
            </p>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <ResponsiveDialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading || isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

export default WeeklyGoalEditor;
