/**
 * Study Sessions Store using Zustand
 */
import { create } from 'zustand';
import type { Session, CreateSessionDto, UpdateSessionDto } from '@/types/api';
import type { SessionsMap, DayData } from '@/types/session';
import { sessionsApi } from '@/lib/api/sessions';
import { transformSessionsToAppFormat, getDayData } from '@/lib/utils/transform';

// Pending deletion entry for undo functionality
export interface PendingDeletion {
  id: string;
  session: Session;
  timeoutId: ReturnType<typeof setTimeout>;
}

interface SessionState {
  sessions: SessionsMap;
  rawSessions: Session[];
  selectedDate: string | null;
  isLoading: boolean; // Initial fetch loading
  isSaving: boolean;  // Add/update/delete operations
  error: string | null;
  pendingDeletions: Map<string, PendingDeletion>;
}

interface SessionActions {
  fetchSessions: (workspaceId: string, startDate?: string, endDate?: string) => Promise<void>;
  addSession: (session: CreateSessionDto) => Promise<Session>;
  updateSession: (id: string, session: UpdateSessionDto) => Promise<Session>;
  deleteSession: (id: string) => Promise<void>;
  // Soft delete with undo support
  softDeleteSession: (id: string, onConfirmDelete: () => void) => Session | null;
  undoDeleteSession: (id: string) => boolean;
  confirmDeleteSession: (id: string) => Promise<void>;
  selectDate: (date: string | null) => void;
  getSessionsForDate: (dateKey: string) => DayData;
  clearSessions: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type SessionStore = SessionState & SessionActions;

// Undo timeout duration in milliseconds (5 seconds)
const UNDO_TIMEOUT = 5000;

export const useSessionStore = create<SessionStore>()((set, get) => ({
  // Initial state
  sessions: {},
  rawSessions: [],
  selectedDate: null,
  isLoading: false,
  isSaving: false,
  error: null,
  pendingDeletions: new Map(),

  // Actions
  fetchSessions: async (workspaceId, startDate, endDate) => {
    try {
      set({ isLoading: true, error: null });
      const rawSessions = await sessionsApi.getAll(workspaceId, startDate, endDate);
      const sessions = transformSessionsToAppFormat(rawSessions);
      set({
        rawSessions,
        sessions,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch sessions',
      });
      throw error;
    }
  },

  addSession: async (sessionData) => {
    try {
      set({ isSaving: true, error: null });
      const newSession = await sessionsApi.create(sessionData);

      // Update local state with new session
      const { rawSessions } = get();
      const updatedRawSessions = [...rawSessions, newSession];
      const sessions = transformSessionsToAppFormat(updatedRawSessions);

      set({
        rawSessions: updatedRawSessions,
        sessions,
        isSaving: false,
      });

      return newSession;
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to add session',
      });
      throw error;
    }
  },

  updateSession: async (id, sessionData) => {
    try {
      set({ isSaving: true, error: null });
      const updatedSession = await sessionsApi.update(id, sessionData);

      // Update local state
      const { rawSessions } = get();
      const updatedRawSessions = rawSessions.map((s) =>
        s.id === id ? updatedSession : s
      );
      const sessions = transformSessionsToAppFormat(updatedRawSessions);

      set({
        rawSessions: updatedRawSessions,
        sessions,
        isSaving: false,
      });

      return updatedSession;
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to update session',
      });
      throw error;
    }
  },

  deleteSession: async (id) => {
    try {
      set({ isSaving: true, error: null });
      await sessionsApi.delete(id);

      // Update local state
      const { rawSessions } = get();
      const updatedRawSessions = rawSessions.filter((s) => s.id !== id);
      const sessions = transformSessionsToAppFormat(updatedRawSessions);

      set({
        rawSessions: updatedRawSessions,
        sessions,
        isSaving: false,
      });
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to delete session',
      });
      throw error;
    }
  },

  // Soft delete: removes from UI but keeps session for potential undo
  softDeleteSession: (id, onConfirmDelete) => {
    const { rawSessions, pendingDeletions } = get();
    const session = rawSessions.find((s) => s.id === id);

    if (!session) return null;

    // Cancel any existing pending deletion for this session
    const existingPending = pendingDeletions.get(id);
    if (existingPending) {
      clearTimeout(existingPending.timeoutId);
    }

    // Remove from UI immediately (optimistic)
    const updatedRawSessions = rawSessions.filter((s) => s.id !== id);
    const sessions = transformSessionsToAppFormat(updatedRawSessions);

    // Set up timeout for permanent deletion
    const timeoutId = setTimeout(() => {
      onConfirmDelete();
    }, UNDO_TIMEOUT);

    // Store in pending deletions
    const newPendingDeletions = new Map(pendingDeletions);
    newPendingDeletions.set(id, {
      id,
      session,
      timeoutId,
    });

    set({
      rawSessions: updatedRawSessions,
      sessions,
      pendingDeletions: newPendingDeletions,
    });

    return session;
  },

  // Undo: restore session from pending deletions
  undoDeleteSession: (id) => {
    const { rawSessions, pendingDeletions } = get();
    const pending = pendingDeletions.get(id);

    if (!pending) return false;

    // Clear the timeout to prevent actual deletion
    clearTimeout(pending.timeoutId);

    // Restore session to state
    const updatedRawSessions = [...rawSessions, pending.session];
    const sessions = transformSessionsToAppFormat(updatedRawSessions);

    // Remove from pending deletions
    const newPendingDeletions = new Map(pendingDeletions);
    newPendingDeletions.delete(id);

    set({
      rawSessions: updatedRawSessions,
      sessions,
      pendingDeletions: newPendingDeletions,
    });

    return true;
  },

  // Confirm deletion: actually delete from API
  confirmDeleteSession: async (id) => {
    const { pendingDeletions } = get();
    const pending = pendingDeletions.get(id);

    // Remove from pending deletions
    const newPendingDeletions = new Map(pendingDeletions);
    newPendingDeletions.delete(id);
    set({ pendingDeletions: newPendingDeletions });

    // Only delete if it was pending (not already undone)
    if (pending) {
      try {
        await sessionsApi.delete(id);
      } catch (error) {
        // If API deletion fails, restore the session to state
        const { rawSessions } = get();
        const updatedRawSessions = [...rawSessions, pending.session];
        const sessions = transformSessionsToAppFormat(updatedRawSessions);
        set({
          rawSessions: updatedRawSessions,
          sessions,
          error: error instanceof Error ? error.message : 'Failed to delete session',
        });
        throw error;
      }
    }
  },

  selectDate: (date) => {
    set({ selectedDate: date });
  },

  getSessionsForDate: (dateKey) => {
    const { sessions } = get();
    return getDayData(sessions, dateKey);
  },

  clearSessions: () => {
    set({
      sessions: {},
      rawSessions: [],
      selectedDate: null,
      error: null,
    });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error });
  },
}));

export default useSessionStore;
