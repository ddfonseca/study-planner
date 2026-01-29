/**
 * Calendar Page - Main study tracking view
 */
import { useEffect, useState, useCallback } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { useConfigStore } from '@/store/configStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useSubjectStore } from '@/store/subjectStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useCalendar } from '@/hooks/useCalendar';
import { useSessions } from '@/hooks/useSessions';
import { useToast } from '@/hooks/use-toast';
import { useWeeklyGoalToast } from '@/hooks/useWeeklyGoalToast';
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonTransition } from '@/components/ui/skeleton-transition';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { ToastAction } from '@/components/ui/toast';
import { Confetti } from '@/components/ui/confetti';
import { Calendar as CalendarIcon } from 'lucide-react';

import {
  CalendarHeader,
  CalendarGrid,
  CalendarGridSkeleton,
  SessionModal,
  StudyTimer,
  WeeklyProgress,
  MobileDayView,
  MobileBottomNav,
} from '@/components/calendar';
import type { MobileTab } from '@/components/calendar';
import { CycleSuggestionCard } from '@/components/study-cycle';
import { formatDateKey } from '@/lib/utils/date';
import { useIsSmallMobile } from '@/hooks/useMediaQuery';
import { useSwipe } from '@/hooks/useSwipe';
import type { DayData } from '@/types/session';

const MOBILE_TABS: MobileTab[] = ['calendar', 'cycle', 'progress', 'timer'];

export function CalendarPage() {
  const { isLoading: sessionsLoading } = useSessionStore();
  const { fetchConfig, isLoading: configLoading } = useConfigStore();
  const { shouldOpenSessionModal, setShouldOpenSessionModal } = useOnboardingStore();
  const { currentWorkspaceId } = useWorkspaceStore();
  const { fetchSubjects, findOrCreateSubject, getActiveSubjects } = useSubjectStore();
  const {
    handleAddSession,
    handleUpdateSession,
    handleSoftDeleteSession,
    getSessionsForDate,
    fetchSessions,
    canModify,
  } = useSessions();
  const { toast } = useToast();

  // Fetch subjects when workspace changes
  useEffect(() => {
    if (currentWorkspaceId) {
      fetchSubjects(currentWorkspaceId);
    }
  }, [currentWorkspaceId, fetchSubjects]);

  // Get active (non-archived) subjects
  const activeSubjects = getActiveSubjects();

  const {
    currentMonth,
    weeks,
    dayNames,
    monthYearDisplay,
    goToNextMonth,
    goToPreviousMonth,
    goToToday,
  } = useCalendar();

  // Weekly goal achievement toast with confetti
  const { confettiProps } = useWeeklyGoalToast();

  const isMobile = useIsSmallMobile();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [mobileTab, setMobileTab] = useState<MobileTab>('calendar');
  const [timerActive, setTimerActive] = useState(false);
  const [isModalHighlighted, setIsModalHighlighted] = useState(false);
  const [isTimerFullscreen, setIsTimerFullscreen] = useState(false);

  // Swipe handlers for tab navigation
  const handleSwipeLeft = useCallback(() => {
    setMobileTab((current) => {
      const currentIndex = MOBILE_TABS.indexOf(current);
      if (currentIndex < MOBILE_TABS.length - 1) {
        return MOBILE_TABS[currentIndex + 1];
      }
      return current;
    });
  }, []);

  const handleSwipeRight = useCallback(() => {
    setMobileTab((current) => {
      const currentIndex = MOBILE_TABS.indexOf(current);
      if (currentIndex > 0) {
        return MOBILE_TABS[currentIndex - 1];
      }
      return current;
    });
  }, []);

  const swipeProps = useSwipe({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
  });

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    await Promise.all([fetchSessions(), fetchConfig()]);
  }, [fetchSessions, fetchConfig]);

  // Fetch data on mount
  useEffect(() => {
    fetchSessions();
    fetchConfig();
  }, [fetchSessions, fetchConfig]);

  // Open SessionModal with highlight after onboarding "Começar"
  useEffect(() => {
    if (shouldOpenSessionModal && !sessionsLoading && !configLoading) {
      // Use queueMicrotask to avoid synchronous setState within effect
      queueMicrotask(() => {
        setSelectedDate(new Date());
        setIsModalOpen(true);
        setIsModalHighlighted(true);
        setShouldOpenSessionModal(false);
      });
    }
  }, [shouldOpenSessionModal, sessionsLoading, configLoading, setShouldOpenSessionModal]);

  // Listen for keyboard shortcut to open new session
  useEffect(() => {
    const handleNewSession = () => {
      setSelectedDate(new Date());
      setIsModalOpen(true);
    };

    window.addEventListener('shortcut:newSession', handleNewSession);
    return () => window.removeEventListener('shortcut:newSession', handleNewSession);
  }, []);

  // Handle cell click - open modal
  const handleCellClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  }, []);

  // Handle edit session from mobile view (opens modal with that day's sessions)
  const handleEditSession = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  // Handle mobile date change
  const handleMobileDateChange = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  // Handle mobile add session
  const handleMobileAddSession = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  // Handle add session
  // Create a new subject on-the-fly
  const handleCreateSubject = useCallback(
    async (name: string) => {
      if (!currentWorkspaceId) {
        throw new Error('Selecione um workspace');
      }
      return findOrCreateSubject(currentWorkspaceId, name);
    },
    [currentWorkspaceId, findOrCreateSubject]
  );

  const handleAddSessionSubmit = useCallback(
    async (subjectId: string, minutes: number) => {
      if (!selectedDate) return;

      try {
        await handleAddSession(formatDateKey(selectedDate), subjectId, minutes);
        toast({
          title: 'Sucesso',
          description: 'Sessão adicionada com sucesso!',
        });
      } catch {
        toast({
          title: 'Erro',
          description: 'Falha ao adicionar sessão',
          variant: 'destructive',
        });
      }
    },
    [selectedDate, handleAddSession, toast]
  );

  // Handle update session
  const handleUpdateSessionSubmit = useCallback(
    async (id: string, subjectId: string, minutes: number) => {
      try {
        await handleUpdateSession(id, subjectId, minutes);
        toast({
          title: 'Sucesso',
          description: 'Sessão atualizada!',
        });
      } catch {
        toast({
          title: 'Erro',
          description: 'Falha ao atualizar sessão',
          variant: 'destructive',
        });
      }
    },
    [handleUpdateSession, toast]
  );

  // Handle delete session with undo support
  const handleDeleteSessionSubmit = useCallback(
    async (id: string) => {
      const result = handleSoftDeleteSession(id);

      if (!result) {
        toast({
          title: 'Erro',
          description: 'Sessão não encontrada',
          variant: 'destructive',
        });
        return;
      }

      const { session, undo } = result;

      const { dismiss } = toast({
        title: 'Sessão removida',
        description: `"${session.subject}" foi removida`,
        duration: 5000,
        action: (
          <ToastAction
            altText="Desfazer remoção da sessão"
            onClick={() => {
              const restored = undo();
              if (restored) {
                dismiss();
                toast({
                  title: 'Sessão restaurada',
                  description: `"${session.subject}" foi restaurada`,
                });
              }
            }}
          >
            Desfazer
          </ToastAction>
        ),
      });
    },
    [handleSoftDeleteSession, toast]
  );

  // Get day data for selected date
  const selectedDayData: DayData = selectedDate
    ? getSessionsForDate(formatDateKey(selectedDate))
    : { totalMinutos: 0, materias: [] };

  const isLoading = sessionsLoading || configLoading;

  const skeletonContent = (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-7 w-48" />
      </div>

      {/* Calendar skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-4">
          {/* CalendarHeader skeleton */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-7 w-36 ml-2" />
            </div>
            <Skeleton className="h-9 w-20" />
          </div>
          <CalendarGridSkeleton />
        </div>

        {/* Sidebar skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );

  // Render mobile content based on active tab
  const renderMobileContent = () => {
    switch (mobileTab) {
      case 'calendar':
        return (
          <MobileDayView
            date={selectedDate || new Date()}
            onDateChange={handleMobileDateChange}
            dayData={selectedDayData}
            onAddSession={handleMobileAddSession}
            onEditSession={handleEditSession}
            onDeleteSession={handleDeleteSessionSubmit}
            canModify={canModify}
          />
        );
      case 'cycle':
        return <CycleSuggestionCard />;
      case 'progress':
        return <WeeklyProgress />;
      case 'timer':
        // Don't render here if fullscreen - single instance rendered in overlay
        if (isTimerFullscreen) return null;
        return (
          <StudyTimer
            subjects={activeSubjects}
          onCreateSubject={handleCreateSubject}
            onRunningChange={setTimerActive}
            fullscreen={isTimerFullscreen}
            onFullscreenChange={setIsTimerFullscreen}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SkeletonTransition isLoading={isLoading} skeleton={skeletonContent}>
    <div className={isMobile ? 'pb-20' : ''}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-6 w-6 text-primary" />
          <h1 className={`font-bold text-foreground ${isMobile ? 'text-xl' : 'text-2xl'}`}>
            Calendário de Estudos
          </h1>
        </div>

        {isMobile ? (
          /* Mobile: Tab-based content with swipe and pull-to-refresh support */
          <PullToRefresh onRefresh={handleRefresh} enabled={!sessionsLoading}>
            <div
              className="touch-action-pan-y"
              onTouchStart={swipeProps.onTouchStart}
              onTouchEnd={swipeProps.onTouchEnd}
            >
              {renderMobileContent()}
            </div>
          </PullToRefresh>
        ) : (
          /* Desktop: Full Calendar with Sidebar */
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
            {/* Calendar */}
            <div className="space-y-4">
              <CalendarHeader
                monthYearDisplay={monthYearDisplay}
                onPreviousMonth={goToPreviousMonth}
                onNextMonth={goToNextMonth}
                onToday={goToToday}
              />
              <CalendarGrid
                weeks={weeks}
                currentMonth={currentMonth}
                dayNames={dayNames}
                onCellClick={handleCellClick}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <CycleSuggestionCard />
              <WeeklyProgress />
              {/* Don't render here if fullscreen - single instance rendered in overlay */}
              {!isTimerFullscreen && (
                <StudyTimer
                  subjects={activeSubjects}
          onCreateSubject={handleCreateSubject}
                  onRunningChange={setTimerActive}
                  fullscreen={isTimerFullscreen}
                  onFullscreenChange={setIsTimerFullscreen}
                />
              )}
            </div>
          </div>
        )}

        {/* Session Modal */}
        <SessionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setIsModalHighlighted(false);
          }}
          date={selectedDate}
          dayData={selectedDayData}
          subjects={activeSubjects}
          onAddSession={handleAddSessionSubmit}
          onUpdateSession={handleUpdateSessionSubmit}
          onDeleteSession={handleDeleteSessionSubmit}
          onCreateSubject={handleCreateSubject}
          canModify={canModify}
          highlighted={isModalHighlighted}
        />
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileBottomNav
          activeTab={mobileTab}
          onTabChange={setMobileTab}
          timerActive={timerActive}
        />
      )}

      {/* Weekly Goal Achievement Confetti */}
      <Confetti {...confettiProps} />

      {/* Fullscreen Timer Overlay */}
      {isTimerFullscreen && (
        <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-4 md:p-8 pb-24 md:pb-8">
          <div className="w-full max-w-md">
            <StudyTimer
              subjects={activeSubjects}
          onCreateSubject={handleCreateSubject}
              onRunningChange={setTimerActive}
              fullscreen={true}
              onFullscreenChange={setIsTimerFullscreen}
            />
          </div>
        </div>
      )}
    </div>
    </SkeletonTransition>
  );
}

export default CalendarPage;
