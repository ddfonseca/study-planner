/**
 * Weekly Goal Editor - Modal for editing weekly goals
 */
import { useState, useEffect, useCallback } from 'react';
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
  const { getGoalForWeek, updateGoal, canEditWeek, canModifyGoals, isLoading } = useWeeklyGoals();
  const [goal, setGoal] = useState<WeeklyGoal | null>(null);
  const [targetHours, setTargetHours] = useState<string>('30');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Can edit if not in "all" mode and week is current or future
  const canEdit = canModifyGoals && canEditWeek(weekStart);

  // Format date range for display
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  });
  const weekStartDisplay = weekStart.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  });

  const loadGoal = useCallback(async () => {
    try {
      setError(null);
      const loadedGoal = await getGoalForWeek(weekStart);
      if (loadedGoal) {
        setGoal(loadedGoal);
        setTargetHours(String(loadedGoal.targetHours));
      }
    } catch {
      setError('Failed to load goal');
    }
  }, [getGoalForWeek, weekStart]);

  useEffect(() => {
    if (isOpen) {
      loadGoal();
    }
  }, [isOpen, loadGoal]);

  const handleSave = async () => {
    const targetValue = parseFloat(targetHours) || 0;

    if (targetValue < 0) {
      setError('Goal must be greater than or equal to 0');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await updateGoal(weekStart, { targetHours: targetValue });
      onClose();
    } catch (err) {
      if (err instanceof Error && err.message.includes('past')) {
        setError('Cannot edit goals for past weeks');
      } else {
        setError('Failed to save goal');
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
            Weekly Goal
            <span className="block text-sm font-normal text-muted-foreground">
              {weekStartDisplay} - {weekEndStr}
            </span>
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <div className="space-y-4 py-4">
          {/* Current progress */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Progress</span>
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
              Weekly Goal (hours)
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

          {!canModifyGoals && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Select a workspace to edit goals.
            </p>
          )}

          {goal?.isCustom && (
            <p className="text-xs text-muted-foreground">
              This goal has been customized for this week.
            </p>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <ResponsiveDialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canEdit || isLoading || isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

export default WeeklyGoalEditor;
