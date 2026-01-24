import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { useSessionStore } from './sessionStore';
import type { Session } from '@/types/api';

// Mock the sessions API
vi.mock('@/lib/api/sessions', () => ({
  sessionsApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock the transform utilities
vi.mock('@/lib/utils/transform', () => ({
  transformSessionsToAppFormat: vi.fn((sessions: Session[]) => {
    const result: Record<string, { totalMinutos: number; materias: { id: string; materia: string; minutos: number }[] }> = {};
    sessions.forEach((session) => {
      const dateKey = session.date.split('T')[0];
      if (!result[dateKey]) {
        result[dateKey] = { totalMinutos: 0, materias: [] };
      }
      result[dateKey].totalMinutos += session.minutes;
      result[dateKey].materias.push({
        id: session.id,
        materia: session.subject,
        minutos: session.minutes,
      });
    });
    return result;
  }),
  getDayData: vi.fn((sessions, dateKey) => {
    return sessions[dateKey] || { totalMinutos: 0, materias: [] };
  }),
}));

import { sessionsApi } from '@/lib/api/sessions';

const mockSessionsApi = vi.mocked(sessionsApi);

const createMockSession = (id: string, subject: string, minutes: number, date = '2025-01-15'): Session => ({
  id,
  userId: 'user-1',
  workspaceId: 'workspace-1',
  date,
  subject,
  minutes,
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2025-01-15T10:00:00Z',
});

describe('sessionStore - Undo Delete Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Reset the store state
    useSessionStore.setState({
      sessions: {},
      rawSessions: [],
      selectedDate: null,
      isLoading: false,
      isSaving: false,
      error: null,
      pendingDeletions: new Map(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('softDeleteSession', () => {
    it('removes session from UI immediately', () => {
      const session = createMockSession('session-1', 'Math', 60);
      useSessionStore.setState({
        rawSessions: [session],
        sessions: {
          '2025-01-15': {
            totalMinutos: 60,
            materias: [{ id: 'session-1', materia: 'Math', minutos: 60 }],
          },
        },
      });

      const store = useSessionStore.getState();
      const onConfirmDelete = vi.fn();

      act(() => {
        store.softDeleteSession('session-1', onConfirmDelete);
      });

      const state = useSessionStore.getState();
      expect(state.rawSessions).toHaveLength(0);
      expect(state.sessions).toEqual({});
    });

    it('stores session in pendingDeletions', () => {
      const session = createMockSession('session-1', 'Math', 60);
      useSessionStore.setState({
        rawSessions: [session],
        sessions: {
          '2025-01-15': {
            totalMinutos: 60,
            materias: [{ id: 'session-1', materia: 'Math', minutos: 60 }],
          },
        },
      });

      const store = useSessionStore.getState();
      const onConfirmDelete = vi.fn();

      act(() => {
        store.softDeleteSession('session-1', onConfirmDelete);
      });

      const state = useSessionStore.getState();
      expect(state.pendingDeletions.has('session-1')).toBe(true);
      expect(state.pendingDeletions.get('session-1')?.session).toEqual(session);
    });

    it('returns the deleted session', () => {
      const session = createMockSession('session-1', 'Math', 60);
      useSessionStore.setState({
        rawSessions: [session],
        sessions: {
          '2025-01-15': {
            totalMinutos: 60,
            materias: [{ id: 'session-1', materia: 'Math', minutos: 60 }],
          },
        },
      });

      const store = useSessionStore.getState();
      const onConfirmDelete = vi.fn();

      let result: Session | null = null;
      act(() => {
        result = store.softDeleteSession('session-1', onConfirmDelete);
      });

      expect(result).toEqual(session);
    });

    it('returns null if session not found', () => {
      useSessionStore.setState({
        rawSessions: [],
        sessions: {},
      });

      const store = useSessionStore.getState();
      const onConfirmDelete = vi.fn();

      let result: Session | null = null;
      act(() => {
        result = store.softDeleteSession('non-existent', onConfirmDelete);
      });

      expect(result).toBeNull();
    });

    it('calls onConfirmDelete after timeout (5 seconds)', () => {
      const session = createMockSession('session-1', 'Math', 60);
      useSessionStore.setState({
        rawSessions: [session],
        sessions: {
          '2025-01-15': {
            totalMinutos: 60,
            materias: [{ id: 'session-1', materia: 'Math', minutos: 60 }],
          },
        },
      });

      const store = useSessionStore.getState();
      const onConfirmDelete = vi.fn();

      act(() => {
        store.softDeleteSession('session-1', onConfirmDelete);
      });

      expect(onConfirmDelete).not.toHaveBeenCalled();

      // Fast forward 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(onConfirmDelete).toHaveBeenCalledTimes(1);
    });

    it('cancels previous pending deletion for same session', () => {
      const session = createMockSession('session-1', 'Math', 60);
      useSessionStore.setState({
        rawSessions: [session],
        sessions: {
          '2025-01-15': {
            totalMinutos: 60,
            materias: [{ id: 'session-1', materia: 'Math', minutos: 60 }],
          },
        },
      });

      const store = useSessionStore.getState();
      const onConfirmDelete1 = vi.fn();
      const onConfirmDelete2 = vi.fn();

      act(() => {
        store.softDeleteSession('session-1', onConfirmDelete1);
      });

      // Add session back for second soft delete
      useSessionStore.setState({
        rawSessions: [session],
      });

      act(() => {
        useSessionStore.getState().softDeleteSession('session-1', onConfirmDelete2);
      });

      // Fast forward 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Only the second callback should have been called
      expect(onConfirmDelete1).not.toHaveBeenCalled();
      expect(onConfirmDelete2).toHaveBeenCalledTimes(1);
    });
  });

  describe('undoDeleteSession', () => {
    it('restores session to rawSessions and sessions', () => {
      const session = createMockSession('session-1', 'Math', 60);
      useSessionStore.setState({
        rawSessions: [session],
        sessions: {
          '2025-01-15': {
            totalMinutos: 60,
            materias: [{ id: 'session-1', materia: 'Math', minutos: 60 }],
          },
        },
      });

      const store = useSessionStore.getState();
      const onConfirmDelete = vi.fn();

      act(() => {
        store.softDeleteSession('session-1', onConfirmDelete);
      });

      // Verify session is removed
      expect(useSessionStore.getState().rawSessions).toHaveLength(0);

      act(() => {
        useSessionStore.getState().undoDeleteSession('session-1');
      });

      const state = useSessionStore.getState();
      expect(state.rawSessions).toHaveLength(1);
      expect(state.rawSessions[0]).toEqual(session);
    });

    it('returns true on successful undo', () => {
      const session = createMockSession('session-1', 'Math', 60);
      useSessionStore.setState({
        rawSessions: [session],
        sessions: {
          '2025-01-15': {
            totalMinutos: 60,
            materias: [{ id: 'session-1', materia: 'Math', minutos: 60 }],
          },
        },
      });

      const store = useSessionStore.getState();
      const onConfirmDelete = vi.fn();

      act(() => {
        store.softDeleteSession('session-1', onConfirmDelete);
      });

      let result = false;
      act(() => {
        result = useSessionStore.getState().undoDeleteSession('session-1');
      });

      expect(result).toBe(true);
    });

    it('returns false if session not in pendingDeletions', () => {
      const store = useSessionStore.getState();

      let result = false;
      act(() => {
        result = store.undoDeleteSession('non-existent');
      });

      expect(result).toBe(false);
    });

    it('clears the timeout to prevent deletion', () => {
      const session = createMockSession('session-1', 'Math', 60);
      useSessionStore.setState({
        rawSessions: [session],
        sessions: {
          '2025-01-15': {
            totalMinutos: 60,
            materias: [{ id: 'session-1', materia: 'Math', minutos: 60 }],
          },
        },
      });

      const store = useSessionStore.getState();
      const onConfirmDelete = vi.fn();

      act(() => {
        store.softDeleteSession('session-1', onConfirmDelete);
      });

      // Undo before timeout
      act(() => {
        useSessionStore.getState().undoDeleteSession('session-1');
      });

      // Fast forward 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // onConfirmDelete should NOT be called because undo was performed
      expect(onConfirmDelete).not.toHaveBeenCalled();
    });

    it('removes session from pendingDeletions after undo', () => {
      const session = createMockSession('session-1', 'Math', 60);
      useSessionStore.setState({
        rawSessions: [session],
        sessions: {
          '2025-01-15': {
            totalMinutos: 60,
            materias: [{ id: 'session-1', materia: 'Math', minutos: 60 }],
          },
        },
      });

      const store = useSessionStore.getState();
      const onConfirmDelete = vi.fn();

      act(() => {
        store.softDeleteSession('session-1', onConfirmDelete);
      });

      expect(useSessionStore.getState().pendingDeletions.has('session-1')).toBe(true);

      act(() => {
        useSessionStore.getState().undoDeleteSession('session-1');
      });

      expect(useSessionStore.getState().pendingDeletions.has('session-1')).toBe(false);
    });
  });

  describe('confirmDeleteSession', () => {
    it('calls API to delete session', async () => {
      const session = createMockSession('session-1', 'Math', 60);
      mockSessionsApi.delete.mockResolvedValue(undefined);

      useSessionStore.setState({
        rawSessions: [session],
        sessions: {
          '2025-01-15': {
            totalMinutos: 60,
            materias: [{ id: 'session-1', materia: 'Math', minutos: 60 }],
          },
        },
      });

      const store = useSessionStore.getState();
      const onConfirmDelete = vi.fn();

      act(() => {
        store.softDeleteSession('session-1', onConfirmDelete);
      });

      await act(async () => {
        await useSessionStore.getState().confirmDeleteSession('session-1');
      });

      expect(mockSessionsApi.delete).toHaveBeenCalledWith('session-1');
    });

    it('removes session from pendingDeletions', async () => {
      const session = createMockSession('session-1', 'Math', 60);
      mockSessionsApi.delete.mockResolvedValue(undefined);

      useSessionStore.setState({
        rawSessions: [session],
        sessions: {
          '2025-01-15': {
            totalMinutos: 60,
            materias: [{ id: 'session-1', materia: 'Math', minutos: 60 }],
          },
        },
      });

      const store = useSessionStore.getState();
      const onConfirmDelete = vi.fn();

      act(() => {
        store.softDeleteSession('session-1', onConfirmDelete);
      });

      expect(useSessionStore.getState().pendingDeletions.has('session-1')).toBe(true);

      await act(async () => {
        await useSessionStore.getState().confirmDeleteSession('session-1');
      });

      expect(useSessionStore.getState().pendingDeletions.has('session-1')).toBe(false);
    });

    it('restores session on API error', async () => {
      const session = createMockSession('session-1', 'Math', 60);
      mockSessionsApi.delete.mockRejectedValue(new Error('API Error'));

      useSessionStore.setState({
        rawSessions: [session],
        sessions: {
          '2025-01-15': {
            totalMinutos: 60,
            materias: [{ id: 'session-1', materia: 'Math', minutos: 60 }],
          },
        },
      });

      const store = useSessionStore.getState();
      const onConfirmDelete = vi.fn();

      act(() => {
        store.softDeleteSession('session-1', onConfirmDelete);
      });

      // Session should be removed from UI
      expect(useSessionStore.getState().rawSessions).toHaveLength(0);

      await act(async () => {
        try {
          await useSessionStore.getState().confirmDeleteSession('session-1');
        } catch {
          // Expected to throw
        }
      });

      // Session should be restored after API error
      const state = useSessionStore.getState();
      expect(state.rawSessions).toHaveLength(1);
      expect(state.rawSessions[0]).toEqual(session);
      expect(state.error).toBe('API Error');
    });

    it('does not call API if session was already undone', async () => {
      const session = createMockSession('session-1', 'Math', 60);
      mockSessionsApi.delete.mockResolvedValue(undefined);

      useSessionStore.setState({
        rawSessions: [session],
        sessions: {
          '2025-01-15': {
            totalMinutos: 60,
            materias: [{ id: 'session-1', materia: 'Math', minutos: 60 }],
          },
        },
      });

      const store = useSessionStore.getState();
      const onConfirmDelete = vi.fn();

      act(() => {
        store.softDeleteSession('session-1', onConfirmDelete);
      });

      // Undo the deletion
      act(() => {
        useSessionStore.getState().undoDeleteSession('session-1');
      });

      // Now call confirmDeleteSession (simulating timeout callback after undo)
      await act(async () => {
        await useSessionStore.getState().confirmDeleteSession('session-1');
      });

      // API should NOT have been called because session was undone
      expect(mockSessionsApi.delete).not.toHaveBeenCalled();
    });
  });

  describe('integration: full undo flow', () => {
    it('soft delete -> undo -> session restored correctly', () => {
      const session = createMockSession('session-1', 'Math', 60);
      useSessionStore.setState({
        rawSessions: [session],
        sessions: {
          '2025-01-15': {
            totalMinutos: 60,
            materias: [{ id: 'session-1', materia: 'Math', minutos: 60 }],
          },
        },
      });

      const onConfirmDelete = vi.fn();

      // Step 1: Soft delete
      act(() => {
        useSessionStore.getState().softDeleteSession('session-1', onConfirmDelete);
      });

      // Verify: Session removed from UI but in pending
      let state = useSessionStore.getState();
      expect(state.rawSessions).toHaveLength(0);
      expect(state.pendingDeletions.has('session-1')).toBe(true);

      // Step 2: Undo
      act(() => {
        useSessionStore.getState().undoDeleteSession('session-1');
      });

      // Verify: Session restored, not in pending
      state = useSessionStore.getState();
      expect(state.rawSessions).toHaveLength(1);
      expect(state.rawSessions[0]).toEqual(session);
      expect(state.pendingDeletions.has('session-1')).toBe(false);

      // Step 3: Timeout passes - should NOT delete
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(onConfirmDelete).not.toHaveBeenCalled();
    });

    it('soft delete -> timeout -> permanent deletion', async () => {
      const session = createMockSession('session-1', 'Math', 60);
      mockSessionsApi.delete.mockResolvedValue(undefined);

      useSessionStore.setState({
        rawSessions: [session],
        sessions: {
          '2025-01-15': {
            totalMinutos: 60,
            materias: [{ id: 'session-1', materia: 'Math', minutos: 60 }],
          },
        },
      });

      let confirmDeleteCalled = false;
      const onConfirmDelete = async () => {
        confirmDeleteCalled = true;
        await useSessionStore.getState().confirmDeleteSession('session-1');
      };

      // Step 1: Soft delete
      act(() => {
        useSessionStore.getState().softDeleteSession('session-1', onConfirmDelete);
      });

      // Step 2: Wait for timeout
      await act(async () => {
        vi.advanceTimersByTime(5000);
        // Allow promise to resolve
        await Promise.resolve();
      });

      expect(confirmDeleteCalled).toBe(true);
      expect(mockSessionsApi.delete).toHaveBeenCalledWith('session-1');
    });
  });
});
