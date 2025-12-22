/**
 * Sessions Hook - Wrapper for session store with additional utilities
 */
import { useCallback } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { CreateSessionDto, UpdateSessionDto } from '@/types/api';
import type { CellIntensity } from '@/types/session';

export function useSessions() {
  const {
    sessions,
    selectedDate,
    isLoading,
    error,
    fetchSessions: storeFetchSessions,
    addSession,
    updateSession,
    deleteSession,
    selectDate,
    getSessionsForDate,
  } = useSessionStore();

  const { currentWorkspaceId } = useWorkspaceStore();

  // Effective workspace ID ("all" for consolidated view)
  const effectiveWorkspaceId = currentWorkspaceId || 'all';

  // Whether user can add/edit sessions (not in "all" mode)
  const canModify = currentWorkspaceId !== null;

  // Fetch sessions with current workspace
  const fetchSessions = useCallback(
    async (startDate?: string, endDate?: string) => {
      return storeFetchSessions(effectiveWorkspaceId, startDate, endDate);
    },
    [storeFetchSessions, effectiveWorkspaceId]
  );

  // Get intensity for a day based on study time (heatmap style)
  // 0 = no study, 1 = <1h, 2 = 1-2h, 3 = 2-3h, 4 = 3h+
  const getCellIntensity = useCallback(
    (dateKey: string): CellIntensity => {
      const dayData = sessions[dateKey];
      if (!dayData || dayData.totalMinutos === 0) {
        return 0;
      }

      const minutes = dayData.totalMinutos;
      if (minutes < 60) return 1;   // < 1h
      if (minutes < 120) return 2;  // 1-2h
      if (minutes < 180) return 3;  // 2-3h
      return 4;                     // 3h+
    },
    [sessions]
  );

  // Add a new study session
  const handleAddSession = useCallback(
    async (date: string, subject: string, minutes: number) => {
      if (!currentWorkspaceId) {
        throw new Error('Selecione um workspace para adicionar sessão');
      }
      const sessionData: CreateSessionDto = {
        workspaceId: currentWorkspaceId,
        date,
        subject,
        minutes,
      };
      return addSession(sessionData);
    },
    [addSession, currentWorkspaceId]
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

  // Get unique subjects from all sessions (for autocomplete)
  const getUniqueSubjects = useCallback((): string[] => {
    const subjectsSet = new Set<string>();
    Object.values(sessions).forEach((dayData) => {
      dayData.materias.forEach((m) => subjectsSet.add(m.materia));
    });
    return Array.from(subjectsSet).sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
    );
  }, [sessions]);

  return {
    sessions,
    selectedDate,
    isLoading,
    error,
    currentWorkspaceId,
    canModify,
    fetchSessions,
    selectDate,
    getSessionsForDate,
    getCellIntensity,
    handleAddSession,
    handleUpdateSession,
    handleDeleteSession,
    getWeekTotals,
    getUniqueSubjects,
  };
}

export default useSessions;
