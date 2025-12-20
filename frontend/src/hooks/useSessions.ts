/**
 * Sessions Hook - Wrapper for session store with additional utilities
 */
import { useCallback } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { useConfigStore } from '@/store/configStore';
import type { CreateSessionDto, UpdateSessionDto } from '@/types/api';
import type { CellStatus } from '@/types/session';
import { hoursToMinutes } from '@/lib/utils/time';

export function useSessions() {
  const {
    sessions,
    selectedDate,
    isLoading,
    error,
    fetchSessions,
    addSession,
    updateSession,
    deleteSession,
    selectDate,
    getSessionsForDate,
  } = useSessionStore();

  const { minHours, desHours } = useConfigStore();

  // Get status for a day based on study time
  const getCellStatus = useCallback(
    (dateKey: string): CellStatus => {
      const dayData = sessions[dateKey];
      if (!dayData || dayData.totalMinutos === 0) {
        return 'empty';
      }

      const minMinutes = hoursToMinutes(minHours);
      const desMinutes = hoursToMinutes(desHours);

      if (dayData.totalMinutos >= desMinutes) {
        return 'desired';
      }
      if (dayData.totalMinutos >= minMinutes) {
        return 'minimum';
      }
      return 'below';
    },
    [sessions, minHours, desHours]
  );

  // Add a new study session
  const handleAddSession = useCallback(
    async (date: string, subject: string, minutes: number) => {
      const sessionData: CreateSessionDto = {
        date,
        subject,
        minutes,
      };
      return addSession(sessionData);
    },
    [addSession]
  );

  // Update a study session
  const handleUpdateSession = useCallback(
    async (id: string, subject: string, minutes: number) => {
      const sessionData: UpdateSessionDto = {
        subject,
        minutes,
      };
      return updateSession(id, sessionData);
    },
    [updateSession]
  );

  // Delete a study session
  const handleDeleteSession = useCallback(
    async (id: string) => {
      return deleteSession(id);
    },
    [deleteSession]
  );

  // Count days meeting minimum/desired hours
  const getMonthStats = useCallback(
    (year: number, month: number) => {
      const minMinutes = hoursToMinutes(minHours);
      const desMinutes = hoursToMinutes(desHours);

      let greenDays = 0;
      let blueDays = 0;

      Object.entries(sessions).forEach(([dateKey, dayData]) => {
        const date = new Date(dateKey);
        if (date.getFullYear() === year && date.getMonth() === month) {
          if (dayData.totalMinutos >= desMinutes) {
            blueDays++;
          } else if (dayData.totalMinutos >= minMinutes) {
            greenDays++;
          }
        }
      });

      return { greenDays, blueDays };
    },
    [sessions, minHours, desHours]
  );

  // Get weekly totals
  const getWeekTotals = useCallback(
    (weekDates: Date[]) => {
      let total = 0;
      weekDates.forEach((date) => {
        const dateKey = date.toISOString().split('T')[0];
        const dayData = sessions[dateKey];
        if (dayData) {
          total += dayData.totalMinutos;
        }
      });
      return total;
    },
    [sessions]
  );

  return {
    sessions,
    selectedDate,
    isLoading,
    error,
    fetchSessions,
    selectDate,
    getSessionsForDate,
    getCellStatus,
    handleAddSession,
    handleUpdateSession,
    handleDeleteSession,
    getMonthStats,
    getWeekTotals,
  };
}

export default useSessions;
