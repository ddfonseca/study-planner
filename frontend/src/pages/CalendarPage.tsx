/**
 * Calendar Page - Main study tracking view
 */
import { useEffect, useState, useCallback } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { useConfigStore } from '@/store/configStore';
import { useCalendar } from '@/hooks/useCalendar';
import { useSessions } from '@/hooks/useSessions';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar as CalendarIcon } from 'lucide-react';

import {
  CalendarHeader,
  CalendarGrid,
  SessionModal,
  MonthSummary,
  ConfigPanel,
} from '@/components/calendar';
import { formatDateKey } from '@/lib/utils/date';
import type { DayData } from '@/types/session';

export function CalendarPage() {
  const { fetchSessions, isLoading: sessionsLoading } = useSessionStore();
  const { fetchConfig, isLoading: configLoading } = useConfigStore();
  const { handleAddSession, handleUpdateSession, handleDeleteSession, getSessionsForDate } = useSessions();
  const { toast } = useToast();

  const {
    currentYear,
    currentMonth,
    weeks,
    monthYearDisplay,
    goToNextMonth,
    goToPreviousMonth,
    goToToday,
  } = useCalendar();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch data on mount
  useEffect(() => {
    fetchSessions();
    fetchConfig();
  }, [fetchSessions, fetchConfig]);

  // Handle cell click - open modal
  const handleCellClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  }, []);

  // Handle add session
  const handleAddSessionSubmit = useCallback(
    async (subject: string, minutes: number) => {
      if (!selectedDate) return;

      try {
        await handleAddSession(formatDateKey(selectedDate), subject, minutes);
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
    async (id: string, subject: string, minutes: number) => {
      try {
        await handleUpdateSession(id, subject, minutes);
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

  // Handle delete session
  const handleDeleteSessionSubmit = useCallback(
    async (id: string) => {
      try {
        await handleDeleteSession(id);
        toast({
          title: 'Sucesso',
          description: 'Sessão removida!',
        });
      } catch {
        toast({
          title: 'Erro',
          description: 'Falha ao remover sessão',
          variant: 'destructive',
        });
      }
    },
    [handleDeleteSession, toast]
  );

  // Get day data for selected date
  const selectedDayData: DayData = selectedDate
    ? getSessionsForDate(formatDateKey(selectedDate))
    : { totalMinutos: 0, materias: [] };

  const isLoading = sessionsLoading || configLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <CalendarIcon className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Calendário de Estudos</h1>
      </div>

      {/* Main content */}
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
            onCellClick={handleCellClick}
            onDeleteSession={handleDeleteSessionSubmit}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <ConfigPanel />
          <MonthSummary year={currentYear} month={currentMonth} />
        </div>
      </div>

      {/* Session Modal */}
      <SessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        date={selectedDate}
        dayData={selectedDayData}
        onAddSession={handleAddSessionSubmit}
        onUpdateSession={handleUpdateSessionSubmit}
        onDeleteSession={handleDeleteSessionSubmit}
      />
    </div>
  );
}

export default CalendarPage;
