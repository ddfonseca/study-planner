/**
 * Weekly Goal Editor - Modal for editing weekly goals
 */
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWeeklyGoals } from '@/hooks/useWeeklyGoals';
import { useSessionStore } from '@/store/sessionStore';
import { formatTime, hoursToMinutes } from '@/lib/utils/time';
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
  const { sessions } = useSessionStore();
  const [goal, setGoal] = useState<WeeklyGoal | null>(null);
  const [minHours, setMinHours] = useState<string>('0');
  const [desHours, setDesHours] = useState<string>('0');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const canEdit = canEditWeek(weekStart);

  // Calculate days meeting daily goals for this week
  const getWeekDayStats = () => {
    if (!goal) return { greenDays: 0, blueDays: 0, dailyMin: 0, dailyDes: 0 };

    const dailyMin = Math.round(goal.minHours / 7);
    const dailyDes = Math.round(goal.desHours / 7);
    const minMinutes = hoursToMinutes(dailyMin);
    const desMinutes = hoursToMinutes(dailyDes);

    let greenDays = 0;
    let blueDays = 0;

    // Check each day of the week
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      const dateKey = day.toISOString().split('T')[0];
      const dayData = sessions[dateKey];

      if (dayData && dayData.totalMinutos >= desMinutes) {
        blueDays++;
      } else if (dayData && dayData.totalMinutos >= minMinutes) {
        greenDays++;
      }
    }

    return { greenDays, blueDays, dailyMin, dailyDes };
  };

  const { greenDays, blueDays, dailyMin, dailyDes } = getWeekDayStats();

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
      setMinHours(String(loadedGoal.minHours));
      setDesHours(String(loadedGoal.desHours));
    } catch (err) {
      setError('Erro ao carregar meta');
    }
  };

  const handleSave = async () => {
    const minValue = parseFloat(minHours) || 0;
    const desValue = parseFloat(desHours) || 0;

    if (minValue > desValue) {
      setError('Meta mínima não pode ser maior que a desejada');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await updateGoal(weekStart, { minHours: minValue, desHours: desValue });
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
  const progress = goal ? Math.min(100, (totalHours / goal.desHours) * 100) : 0;
  const status =
    goal && totalHours >= goal.desHours
      ? 'BLUE'
      : goal && totalHours >= goal.minHours
        ? 'GREEN'
        : 'NONE';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            Meta da Semana
            <span className="block text-sm font-normal text-muted-foreground">
              {weekStartDisplay} - {weekEndStr}
            </span>
          </DialogTitle>
        </DialogHeader>

        {!canEdit && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Metas de semanas passadas não podem ser editadas.
            </p>
          </div>
        )}

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
                  status === 'BLUE'
                    ? 'bg-blue-500'
                    : status === 'GREEN'
                      ? 'bg-green-500'
                      : 'bg-gray-400'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {goal && (
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0h</span>
                <span className="text-green-600 dark:text-green-400">
                  {goal.minHours}h
                </span>
                <span className="text-blue-600 dark:text-blue-400">
                  {goal.desHours}h
                </span>
              </div>
            )}

            {/* Days meeting daily goals */}
            {goal && (
              <div className="flex gap-4 mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/50" />
                  <span className="text-xs text-muted-foreground">
                    ≥{dailyMin}h/dia:
                  </span>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {greenDays}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500/50" />
                  <span className="text-xs text-muted-foreground">
                    ≥{dailyDes}h/dia:
                  </span>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {blueDays}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Goal inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minHours" className="text-green-600 dark:text-green-400">
                Meta Mínima (h)
              </Label>
              <Input
                id="minHours"
                type="number"
                min="0"
                step="0.5"
                value={minHours}
                onChange={(e) => setMinHours(e.target.value)}
                disabled={!canEdit || isLoading || isSaving}
                className="bg-green-500/5 border-green-500/20 focus:border-green-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desHours" className="text-blue-600 dark:text-blue-400">
                Meta Desejada (h)
              </Label>
              <Input
                id="desHours"
                type="number"
                min="0"
                step="0.5"
                value={desHours}
                onChange={(e) => setDesHours(e.target.value)}
                disabled={!canEdit || isLoading || isSaving}
                className="bg-blue-500/5 border-blue-500/20 focus:border-blue-500"
              />
            </div>
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          {canEdit && (
            <Button onClick={handleSave} disabled={isLoading || isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default WeeklyGoalEditor;
