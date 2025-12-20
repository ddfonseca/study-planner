/**
 * Authentication Store using Zustand with Better Auth
 */
import { create } from 'zustand';
import type { User } from '@/types/api';
import { authApi } from '@/lib/api/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  setUser: (user: User) => void;
  clearAuth: () => void;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()((set) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start as loading to check session
  error: null,

  // Actions
  setUser: (user) => {
    set({
      user,
      isAuthenticated: true,
      error: null,
    });
  },

  clearAuth: () => {
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  login: async () => {
    try {
      set({ isLoading: true, error: null });
      await authApi.login();
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to login',
      });
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await authApi.logout();
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  checkSession: async () => {
    try {
      set({ isLoading: true, error: null });
      const session = await authApi.getSession();
      if (session) {
        set({
          user: session.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check session',
      });
    }
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error });
  },
}));

export default useAuthStore;
