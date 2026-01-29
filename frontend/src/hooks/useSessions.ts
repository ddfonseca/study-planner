/**
 * Sessions Hook - Wrapper for session store with additional utilities
 */
import { useCallback } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useStudyCycleStore } from '@/store/studyCycleStore';
import type { CreateSessionDto, UpdateSessionDto, Session } from '@/types/api';
import type { CellIntensity } from '@/types/session';
import { formatDateKey } from '@/lib/utils/date';

export interface UndoDeleteResult {
  session: Session;
  undo: () => boolean;
  confirmDelete: () => Promise<void>;
}

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
    softDeleteSession,
    undoDeleteSession,
    confirmDeleteSession,
    selectDate,
    getSessionsForDate,
  } = useSessionStore();

  const { currentWorkspaceId } = useWorkspaceStore();
  const { cycle, fetchSuggestion } = useStudyCycleStore();

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
      const result = await addSession(sessionData);
      // Refresh cycle suggestion to reflect new accumulated minutes
      fetchSuggestion(currentWorkspaceId);
      return result;
    },
    [addSession, currentWorkspaceId, fetchSuggestion]
  );

  // Update a study session
  const handleUpdateSession = useCallback(
    async (id: string, subject: string, minutes: number) => {
      const sessionData: UpdateSessionDto = {
        subject,
        minutes,
      };
      const result = await updateSession(id, sessionData);
      // Refresh cycle suggestion to reflect updated minutes
      if (currentWorkspaceId) {
        fetchSuggestion(currentWorkspaceId);
      }
      return result;
    },
    [updateSession, currentWorkspaceId, fetchSuggestion]
  );

  // Delete a study session (immediate, no undo)
  const handleDeleteSession = useCallback(
    async (id: string) => {
      const result = await deleteSession(id);
      // Refresh cycle suggestion to reflect deleted minutes
      if (currentWorkspaceId) {
        fetchSuggestion(currentWorkspaceId);
      }
      return result;
    },
    [deleteSession, currentWorkspaceId, fetchSuggestion]
  );

  // Soft delete with undo support - returns undo/confirm functions
  const handleSoftDeleteSession = useCallback(
    (id: string): UndoDeleteResult | null => {
      const confirmDelete = async () => {
        await confirmDeleteSession(id);
        // Refresh cycle suggestion after confirmed deletion
        if (currentWorkspaceId) {
          fetchSuggestion(currentWorkspaceId);
        }
      };

      const session = softDeleteSession(id, confirmDelete);
      if (!session) return null;

      return {
        session,
        undo: () => {
          const restored = undoDeleteSession(id);
          // Refresh cycle suggestion after undo
          if (restored && currentWorkspaceId) {
            fetchSuggestion(currentWorkspaceId);
          }
          return restored;
        },
        confirmDelete,
      };
    },
    [softDeleteSession, undoDeleteSession, confirmDeleteSession, currentWorkspaceId, fetchSuggestion]
  );

  // Get weekly totals
  const getWeekTotals = useCallback(
    (weekDates: Date[]) => {
      let total = 0;
      weekDates.forEach((date) => {
        const dateKey = formatDateKey(date);
        const dayData = sessions[dateKey];
        if (dayData) {
          total += dayData.totalMinutos;
        }
      });
      return total;
    },
    [sessions]
  );

  // Get unique subjects from all sessions and cycle (for autocomplete)
  const getUniqueSubjects = useCallback((): string[] => {
    const subjectsSet = new Set<string>();
    Object.values(sessions).forEach((dayData) => {
      dayData.materias.forEach((m) => subjectsSet.add(m.materia));
    });
    // Include subjects from study cycle
    cycle?.items.forEach((item) => subjectsSet.add(item.subject));
    return Array.from(subjectsSet).sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
    );
  }, [sessions, cycle]);

  // Check if a month has any sessions
  const hasSessionsInMonth = useCallback(
    (weeks: Date[][]): boolean => {
      for (const week of weeks) {
        for (const date of week) {
          const dateKey = formatDateKey(date);
          const dayData = sessions[dateKey];
          if (dayData && dayData.totalMinutos > 0) {
            return true;
          }
        }
      }
      return false;
    },
    [sessions]
  );

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
    handleSoftDeleteSession,
    getWeekTotals,
    getUniqueSubjects,
    hasSessionsInMonth,
  };
}

export default useSessions;
