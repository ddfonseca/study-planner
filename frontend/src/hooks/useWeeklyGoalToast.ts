/**
 * useWeeklyGoalToast Hook
 * Monitors weekly goal progress and shows a special toast when goal is achieved
 */
import { useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useWeeklyGoals } from '@/hooks/useWeeklyGoals';
import { useSessionStore } from '@/store/sessionStore';
import { useConfigStore } from '@/store/configStore';
import { useHaptic } from '@/hooks/useHaptic';
import { useConfetti } from '@/hooks/useConfetti';
import { useAchievementsStore } from '@/store/achievementsStore';
import type { ConfettiProps } from '@/components/ui/confetti';

interface UseWeeklyGoalToastOptions {
  /** Enable/disable the toast (default: true) */
  enabled?: boolean;
}

interface UseWeeklyGoalToastReturn {
  /** Whether the weekly goal is achieved */
  isGoalAchieved: boolean;
  /** Current progress percentage (0-100) */
  progress: number;
  /** Props to spread on the Confetti component */
  confettiProps: ConfettiProps;
}

/**
 * Hook that monitors weekly goal achievement and shows a celebratory toast
 * when the user reaches their weekly study goal.
 *
 * Features:
 * - Shows special "success" toast with celebratory message
 * - Triggers confetti animation
 * - Provides haptic feedback on mobile devices
 * - Only triggers once per achievement (not on every session add)
 */
export function useWeeklyGoalToast(
  options: UseWeeklyGoalToastOptions = {}
): UseWeeklyGoalToastReturn {
  const { enabled = true } = options;

  const { celebrationsEnabled } = useConfigStore();
  const isEnabled = enabled && celebrationsEnabled;

  const { toast } = useToast();
  const { getWeekStatus, calculateWeekStart } = useWeeklyGoals();
  const rawSessions = useSessionStore((state) => state.rawSessions);
  const { triggerPattern } = useHaptic();
  const { fire: fireConfetti, confettiProps } = useConfetti({
    duration: 4000,
    particleCount: 200,
  });

  // Use persistent achievements store to prevent showing achievements on page refresh
  const { hasAchievementBeenShown, markAchievementShown, _hasHydrated } = useAchievementsStore();

  // Track previous achievement state to detect transitions
  const previousAchievedRef = useRef<boolean | null>(null);

  // Get current week status
  const today = new Date();
  const currentWeekStart = calculateWeekStart(today);
  const weekStatus = getWeekStatus(today, rawSessions);

  // Show toast when goal is achieved for the first time
  const showWeeklyGoalToast = useCallback(() => {
    const targetHours = weekStatus.goal?.targetHours ?? 0;
    const formattedHours = weekStatus.totalHours.toFixed(1);

    fireConfetti();
    triggerPattern('success');

    toast({
      title: '🎉 Meta Semanal Alcançada!',
      description: `Parabéns! Você estudou ${formattedHours}h de ${targetHours}h esta semana.`,
      variant: 'success',
      duration: 6000,
    });
  }, [toast, weekStatus.goal?.targetHours, weekStatus.totalHours, fireConfetti, triggerPattern]);

  // Effect to detect goal achievement transition
  useEffect(() => {
    if (!isEnabled || !_hasHydrated) return;

    const { achieved } = weekStatus;

    // Check if this achievement has already been shown (persisted)
    const alreadyShownPersisted = hasAchievementBeenShown('weekly_goal', currentWeekStart);

    // Check if this is a transition from not-achieved to achieved
    const wasNotAchieved = previousAchievedRef.current === false;
    const isNowAchieved = achieved;

    if (wasNotAchieved && isNowAchieved && !alreadyShownPersisted) {
      showWeeklyGoalToast();
      markAchievementShown('weekly_goal', currentWeekStart);
    }

    // Update previous state
    previousAchievedRef.current = achieved;
  }, [isEnabled, weekStatus, currentWeekStart, showWeeklyGoalToast, _hasHydrated, hasAchievementBeenShown, markAchievementShown]);

  return {
    isGoalAchieved: weekStatus.achieved,
    progress: weekStatus.progress,
    confettiProps,
  };
}

export default useWeeklyGoalToast;
