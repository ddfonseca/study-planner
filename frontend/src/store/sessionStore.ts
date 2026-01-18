/**
 * Study Sessions Store using Zustand
 */
import { create } from 'zustand';
import type { Session, CreateSessionDto, UpdateSessionDto, StreakData, ReviewSuggestion } from '@/types/api';
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
  streak: StreakData | null;
  isLoadingStreak: boolean;
  reviewSuggestions: ReviewSuggestion[];
  isLoadingReviewSuggestions: boolean;
}

interface SessionActions {
  fetchSessions: (workspaceId: string, startDate?: string, endDate?: string) => Promise<void>;
  addSession: (session: CreateSessionDto) => Promise<Session>;
  updateSession: (id: string, session: UpdateSessionDto) => Promise<Session>;
  deleteSession: (id: string) => Promise<void>;
  selectDate: (date: string | null) => void;
  getSessionsForDate: (dateKey: string) => DayData;
  clearSessions: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchStreak: (workspaceId: string) => Promise<void>;
  fetchReviewSuggestions: (workspaceId: string) => Promise<void>;
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
  streak: null,
  isLoadingStreak: false,
  reviewSuggestions: [],
  isLoadingReviewSuggestions: false,

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

  fetchStreak: async (workspaceId) => {
    try {
      set({ isLoadingStreak: true });
      const streak = await sessionsApi.getStreak(workspaceId);
      set({ streak, isLoadingStreak: false });
    } catch (error) {
      set({ isLoadingStreak: false });
      // Silently fail for streak - it's not critical
      console.error('Failed to fetch streak:', error);
    }
  },

  fetchReviewSuggestions: async (workspaceId) => {
    try {
      set({ isLoadingReviewSuggestions: true });
      const reviewSuggestions = await sessionsApi.getReviewSuggestions(workspaceId);
      set({ reviewSuggestions, isLoadingReviewSuggestions: false });
    } catch (error) {
      set({ isLoadingReviewSuggestions: false });
      // Silently fail for review suggestions - not critical
      console.error('Failed to fetch review suggestions:', error);
    }
  },
}));

export default useSessionStore;
