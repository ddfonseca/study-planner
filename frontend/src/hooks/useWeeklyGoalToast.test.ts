import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';

// Create mock functions using vi.hoisted to ensure they're available for vi.mock
const {
  mockToast,
  mockFireConfetti,
  mockTriggerPattern,
  mockCalculateWeekStart,
  mockGetWeekStatus,
  mockHasAchievementBeenShown,
  mockMarkAchievementShown,
  mockCelebrationsEnabled,
} = vi.hoisted(() => ({
  mockToast: vi.fn(),
  mockFireConfetti: vi.fn(),
  mockTriggerPattern: vi.fn(),
  mockCalculateWeekStart: vi.fn(() => '2024-01-15'),
  mockGetWeekStatus: vi.fn(),
  mockHasAchievementBeenShown: vi.fn(() => false),
  mockMarkAchievementShown: vi.fn(),
  mockCelebrationsEnabled: { value: true },
}));

// Mock dependencies
vi.mock('./use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
  toast: mockToast,
}));

vi.mock('./useWeeklyGoals', () => ({
  useWeeklyGoals: () => ({
    goals: {},
    isLoading: false,
    error: null,
    currentWorkspaceId: 'workspace-1',
    canModifyGoals: true,
    getGoalForWeek: vi.fn(),
    getCachedGoalForWeek: vi.fn(),
    updateGoal: vi.fn(),
    prefetchGoals: vi.fn(),
    canEditWeek: vi.fn(),
    getWeekStatus: mockGetWeekStatus,
    calculateWeekStart: mockCalculateWeekStart,
  }),
}));

vi.mock('@/store/sessionStore', () => ({
  useSessionStore: () => [],
}));

vi.mock('@/store/configStore', () => ({
  useConfigStore: () => ({
    celebrationsEnabled: mockCelebrationsEnabled.value,
  }),
}));

vi.mock('./useHaptic', () => ({
  useHaptic: () => ({
    trigger: vi.fn(),
    triggerPattern: mockTriggerPattern,
    isSupported: true,
  }),
}));

vi.mock('./useConfetti', () => ({
  useConfetti: () => ({
    isActive: false,
    fire: mockFireConfetti,
    stop: vi.fn(),
    confettiProps: {
      active: false,
      duration: 4000,
      particleCount: 200,
      onComplete: vi.fn(),
    },
  }),
}));

vi.mock('@/store/achievementsStore', () => ({
  useAchievementsStore: () => ({
    hasAchievementBeenShown: mockHasAchievementBeenShown,
    markAchievementShown: mockMarkAchievementShown,
    _hasHydrated: true,
  }),
}));

// Import after mocks are set up
import { useWeeklyGoalToast } from './useWeeklyGoalToast';

describe('useWeeklyGoalToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    // Default mock return values
    mockGetWeekStatus.mockReturnValue({
      goal: { targetHours: 10 },
      totalMinutes: 300,
      totalHours: 5,
      achieved: false,
      progress: 50,
      isLoading: false,
    });

    // Default: no achievement has been shown yet
    mockHasAchievementBeenShown.mockReturnValue(false);

    // Default: celebrations are enabled
    mockCelebrationsEnabled.value = true;
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('returns isGoalAchieved from week status', () => {
      mockGetWeekStatus.mockReturnValue({
        goal: { targetHours: 10 },
        totalMinutes: 300,
        totalHours: 5,
        achieved: false,
        progress: 50,
        isLoading: false,
      });

      const { result } = renderHook(() => useWeeklyGoalToast());

      expect(result.current.isGoalAchieved).toBe(false);
    });

    it('returns progress from week status', () => {
      mockGetWeekStatus.mockReturnValue({
        goal: { targetHours: 10 },
        totalMinutes: 300,
        totalHours: 5,
        achieved: false,
        progress: 50,
        isLoading: false,
      });

      const { result } = renderHook(() => useWeeklyGoalToast());

      expect(result.current.progress).toBe(50);
    });

    it('returns confettiProps for rendering Confetti component', () => {
      mockGetWeekStatus.mockReturnValue({
        goal: { targetHours: 10 },
        totalMinutes: 300,
        totalHours: 5,
        achieved: false,
        progress: 50,
        isLoading: false,
      });

      const { result } = renderHook(() => useWeeklyGoalToast());

      expect(result.current.confettiProps).toBeDefined();
      expect(result.current.confettiProps.duration).toBe(4000);
      expect(result.current.confettiProps.particleCount).toBe(200);
    });
  });

  describe('goal achievement detection', () => {
    it('does not show toast when goal is not achieved', () => {
      mockGetWeekStatus.mockReturnValue({
        goal: { targetHours: 10 },
        totalMinutes: 300,
        totalHours: 5,
        achieved: false,
        progress: 50,
        isLoading: false,
      });

      renderHook(() => useWeeklyGoalToast());

      expect(mockToast).not.toHaveBeenCalled();
      expect(mockFireConfetti).not.toHaveBeenCalled();
    });

    it('does not show toast when goal was already achieved (no transition)', () => {
      // Goal is already achieved from the start
      mockGetWeekStatus.mockReturnValue({
        goal: { targetHours: 10 },
        totalMinutes: 600,
        totalHours: 10,
        achieved: true,
        progress: 100,
        isLoading: false,
      });

      renderHook(() => useWeeklyGoalToast());

      // Should not show toast because we don't know the previous state
      expect(mockToast).not.toHaveBeenCalled();
    });

    it('shows toast when transitioning from not achieved to achieved', () => {
      // Start with not achieved
      mockGetWeekStatus.mockReturnValue({
        goal: { targetHours: 10 },
        totalMinutes: 300,
        totalHours: 5,
        achieved: false,
        progress: 50,
        isLoading: false,
      });

      const { rerender } = renderHook(() => useWeeklyGoalToast());

      // Transition to achieved
      mockGetWeekStatus.mockReturnValue({
        goal: { targetHours: 10 },
        totalMinutes: 600,
        totalHours: 10,
        achieved: true,
        progress: 100,
        isLoading: false,
      });

      act(() => {
        rerender();
      });

      expect(mockFireConfetti).toHaveBeenCalled();
      expect(mockTriggerPattern).toHaveBeenCalledWith('success');
    });

    it('does not show toast again for the same week', () => {
      // Start with not achieved
      mockGetWeekStatus.mockReturnValue({
        goal: { targetHours: 10 },
        totalMinutes: 300,
        totalHours: 5,
        achieved: false,
        progress: 50,
        isLoading: false,
      });

      const { rerender } = renderHook(() => useWeeklyGoalToast());

      // Transition to achieved
      mockGetWeekStatus.mockReturnValue({
        goal: { targetHours: 10 },
        totalMinutes: 600,
        totalHours: 10,
        achieved: true,
        progress: 100,
        isLoading: false,
      });

      act(() => {
        rerender();
      });

      expect(mockFireConfetti).toHaveBeenCalledTimes(1);

      // Simulate persistence: achievement was marked as shown
      mockHasAchievementBeenShown.mockReturnValue(true);

      // Go back to not achieved (maybe goal was updated)
      mockGetWeekStatus.mockReturnValue({
        goal: { targetHours: 15 },
        totalMinutes: 600,
        totalHours: 10,
        achieved: false,
        progress: 67,
        isLoading: false,
      });

      act(() => {
        rerender();
      });

      // Achieve again
      mockGetWeekStatus.mockReturnValue({
        goal: { targetHours: 15 },
        totalMinutes: 900,
        totalHours: 15,
        achieved: true,
        progress: 100,
        isLoading: false,
      });

      act(() => {
        rerender();
      });

      // Should not fire again for same week (persisted)
      expect(mockFireConfetti).toHaveBeenCalledTimes(1);
    });
  });

  describe('enabled option', () => {
    it('does not show toast when disabled', () => {
      // Start with not achieved
      mockGetWeekStatus.mockReturnValue({
        goal: { targetHours: 10 },
        totalMinutes: 300,
        totalHours: 5,
        achieved: false,
        progress: 50,
        isLoading: false,
      });

      const { rerender } = renderHook(() => useWeeklyGoalToast({ enabled: false }));

      // Transition to achieved
      mockGetWeekStatus.mockReturnValue({
        goal: { targetHours: 10 },
        totalMinutes: 600,
        totalHours: 10,
        achieved: true,
        progress: 100,
        isLoading: false,
      });

      act(() => {
        rerender();
      });

      expect(mockToast).not.toHaveBeenCalled();
      expect(mockFireConfetti).not.toHaveBeenCalled();
    });

    it('defaults to enabled', () => {
      mockGetWeekStatus.mockReturnValue({
        goal: { targetHours: 10 },
        totalMinutes: 300,
        totalHours: 5,
        achieved: false,
        progress: 50,
        isLoading: false,
      });

      const { rerender } = renderHook(() => useWeeklyGoalToast());

      mockGetWeekStatus.mockReturnValue({
        goal: { targetHours: 10 },
        totalMinutes: 600,
        totalHours: 10,
        achieved: true,
        progress: 100,
        isLoading: false,
      });

      act(() => {
        rerender();
      });

      expect(mockFireConfetti).toHaveBeenCalled();
    });
  });

  describe('celebrationsEnabled setting', () => {
    it('does not show toast when celebrationsEnabled is false in config', () => {
      // Disable celebrations in config
      mockCelebrationsEnabled.value = false;

      // Start with not achieved
      mockGetWeekStatus.mockReturnValue({
        goal: { targetHours: 10 },
        totalMinutes: 300,
        totalHours: 5,
        achieved: false,
        progress: 50,
        isLoading: false,
      });

      const { rerender } = renderHook(() => useWeeklyGoalToast());

      // Transition to achieved
      mockGetWeekStatus.mockReturnValue({
        goal: { targetHours: 10 },
        totalMinutes: 600,
        totalHours: 10,
        achieved: true,
        progress: 100,
        isLoading: false,
      });

      act(() => {
        rerender();
      });

      expect(mockToast).not.toHaveBeenCalled();
      expect(mockFireConfetti).not.toHaveBeenCalled();
    });

    it('shows toast when celebrationsEnabled is true in config', () => {
      // Enable celebrations in config
      mockCelebrationsEnabled.value = true;

      // Start with not achieved
      mockGetWeekStatus.mockReturnValue({
        goal: { targetHours: 10 },
        totalMinutes: 300,
        totalHours: 5,
        achieved: false,
        progress: 50,
        isLoading: false,
      });

      const { rerender } = renderHook(() => useWeeklyGoalToast());

      // Transition to achieved
      mockGetWeekStatus.mockReturnValue({
        goal: { targetHours: 10 },
        totalMinutes: 600,
        totalHours: 10,
        achieved: true,
        progress: 100,
        isLoading: false,
      });

      act(() => {
        rerender();
      });

      expect(mockFireConfetti).toHaveBeenCalled();
      expect(mockTriggerPattern).toHaveBeenCalledWith('success');
      expect(mockToast).toHaveBeenCalled();
    });

    it('does not show toast when both enabled option and celebrationsEnabled are false', () => {
      // Disable celebrations in config
      mockCelebrationsEnabled.value = false;

      // Start with not achieved
      mockGetWeekStatus.mockReturnValue({
        goal: { targetHours: 10 },
        totalMinutes: 300,
        totalHours: 5,
        achieved: false,
        progress: 50,
        isLoading: false,
      });

      const { rerender } = renderHook(() => useWeeklyGoalToast({ enabled: false }));

      // Transition to achieved
      mockGetWeekStatus.mockReturnValue({
        goal: { targetHours: 10 },
        totalMinutes: 600,
        totalHours: 10,
        achieved: true,
        progress: 100,
        isLoading: false,
      });

      act(() => {
        rerender();
      });

      expect(mockToast).not.toHaveBeenCalled();
      expect(mockFireConfetti).not.toHaveBeenCalled();
    });
  });

  describe('week change', () => {
    it('stores current week start to prevent duplicate toasts', () => {
      // Start with not achieved
      mockGetWeekStatus.mockReturnValue({
        goal: { targetHours: 10 },
        totalMinutes: 300,
        totalHours: 5,
        achieved: false,
        progress: 50,
        isLoading: false,
      });

      const { rerender } = renderHook(() => useWeeklyGoalToast());

      // Achieve goal
      mockGetWeekStatus.mockReturnValue({
        goal: { targetHours: 10 },
        totalMinutes: 600,
        totalHours: 10,
        achieved: true,
        progress: 100,
        isLoading: false,
      });

      act(() => {
        rerender();
      });

      expect(mockFireConfetti).toHaveBeenCalledTimes(1);
      expect(mockTriggerPattern).toHaveBeenCalledTimes(1);
      expect(mockToast).toHaveBeenCalledTimes(1);

      // Verify toast was called with correct parameters
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('Meta Semanal'),
          variant: 'success',
          duration: 6000,
        })
      );
    });
  });

  describe('persistence', () => {
    it('marks achievement as shown when goal is achieved', () => {
      // Start with not achieved
      mockGetWeekStatus.mockReturnValue({
        goal: { targetHours: 10 },
        totalMinutes: 300,
        totalHours: 5,
        achieved: false,
        progress: 50,
        isLoading: false,
      });

      const { rerender } = renderHook(() => useWeeklyGoalToast());

      // Transition to achieved
      mockGetWeekStatus.mockReturnValue({
        goal: { targetHours: 10 },
        totalMinutes: 600,
        totalHours: 10,
        achieved: true,
        progress: 100,
        isLoading: false,
      });

      act(() => {
        rerender();
      });

      // Should mark achievement as shown in the store
      expect(mockMarkAchievementShown).toHaveBeenCalledWith('weekly_goal', '2024-01-15');
    });

    it('does not show toast if achievement was already shown (persisted)', () => {
      // Achievement was already shown in a previous session
      mockHasAchievementBeenShown.mockReturnValue(true);

      // Start with not achieved
      mockGetWeekStatus.mockReturnValue({
        goal: { targetHours: 10 },
        totalMinutes: 300,
        totalHours: 5,
        achieved: false,
        progress: 50,
        isLoading: false,
      });

      const { rerender } = renderHook(() => useWeeklyGoalToast());

      // Transition to achieved
      mockGetWeekStatus.mockReturnValue({
        goal: { targetHours: 10 },
        totalMinutes: 600,
        totalHours: 10,
        achieved: true,
        progress: 100,
        isLoading: false,
      });

      act(() => {
        rerender();
      });

      // Should not show toast or confetti since achievement was already shown
      expect(mockToast).not.toHaveBeenCalled();
      expect(mockFireConfetti).not.toHaveBeenCalled();
    });
  });
});
