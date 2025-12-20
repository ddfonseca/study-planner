/**
 * Study Sessions Store using Zustand
 */
import { create } from 'zustand';
import type { Session, CreateSessionDto, UpdateSessionDto } from '@/types/api';
import type { SessionsMap, DayData } from '@/types/session';
import { sessionsApi } from '@/lib/api/sessions';
import { transformSessionsToAppFormat, getDayData } from '@/lib/utils/transform';

interface SessionState {
  sessions: SessionsMap;
  rawSessions: Session[];
  selectedDate: string | null;
  isLoading: boolean; // Initial fetch loading
  isSaving: boolean;  // Add/update/delete operations
  error: string | null;
}

interface SessionActions {
  fetchSessions: (startDate?: string, endDate?: string) => Promise<void>;
  addSession: (session: CreateSessionDto) => Promise<Session>;
  updateSession: (id: string, session: UpdateSessionDto) => Promise<Session>;
  deleteSession: (id: string) => Promise<void>;
  selectDate: (date: string | null) => void;
  getSessionsForDate: (dateKey: string) => DayData;
  clearSessions: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type SessionStore = SessionState & SessionActions;

export const useSessionStore = create<SessionStore>()((set, get) => ({
  // Initial state
  sessions: {},
  rawSessions: [],
  selectedDate: null,
  isLoading: false,
  isSaving: false,
  error: null,

  // Actions
  fetchSessions: async (startDate, endDate) => {
    try {
      set({ isLoading: true, error: null });
      const rawSessions = await sessionsApi.getAll(startDate, endDate);
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
