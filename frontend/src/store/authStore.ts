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
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  isEmailAuthEnabled: () => boolean;
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
        error: error instanceof Error ? error.message : 'Falha ao entrar',
      });
    }
  },

  loginWithEmail: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const result = await authApi.loginWithEmail(email, password);
      if (!result.success) {
        set({ isLoading: false, error: result.error || 'Falha ao entrar' });
        return false;
      }
      // Session will be checked after redirect
      return true;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Falha ao entrar',
      });
      return false;
    }
  },

  signUpWithEmail: async (email: string, password: string, name: string) => {
    try {
      set({ isLoading: true, error: null });
      const result = await authApi.signUpWithEmail(email, password, name);
      if (!result.success) {
        set({ isLoading: false, error: result.error || 'Falha ao criar conta' });
        return false;
      }
      // Session will be checked after redirect
      return true;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Falha ao criar conta',
      });
      return false;
    }
  },

  isEmailAuthEnabled: () => {
    return authApi.isEmailAuthEnabled();
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
        error: error instanceof Error ? error.message : 'Falha ao verificar sessão',
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
