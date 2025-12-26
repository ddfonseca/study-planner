/**
 * Authentication API using Better Auth
 */
import { createAuthClient } from 'better-auth/client';
import type { User } from '@/types/api';

// In production: empty string (uses Netlify proxy at same domain)
// In development: localhost:3000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';

// Create Better Auth client
export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  basePath: '/api/auth',
  fetchOptions: {
    credentials: 'include', // Required for cross-domain cookies
  },
});

// Check if email auth is enabled (dev only - for testing with ngrok)
const IS_DEV = import.meta.env.DEV;

export const authApi = {
  /**
   * Check if email/password auth is available (dev only)
   */
  isEmailAuthEnabled(): boolean {
    return IS_DEV;
  },

  /**
   * Initiate Google OAuth login using Better Auth
   */
  async login(): Promise<void> {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: `${FRONTEND_URL}/app/calendar`,
    });
  },

  /**
   * Sign in with email and password (dev only)
   */
  async loginWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    if (!IS_DEV) {
      return { success: false, error: 'Email auth not available in production' };
    }

    const result = await authClient.signIn.email({
      email,
      password,
      callbackURL: `${FRONTEND_URL}/app/calendar`,
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true };
  },

  /**
   * Sign up with email and password (dev only)
   */
  async signUpWithEmail(email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> {
    if (!IS_DEV) {
      return { success: false, error: 'Email auth not available in production' };
    }

    const result = await authClient.signUp.email({
      email,
      password,
      name,
      callbackURL: `${FRONTEND_URL}/app/calendar`,
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true };
  },

  /**
   * Get current authenticated session
   */
  async getSession(): Promise<{ user: User } | null> {
    const session = await authClient.getSession();
    if (session.data) {
      return {
        user: {
          id: session.data.user.id,
          email: session.data.user.email,
          name: session.data.user.name,
          image: session.data.user.image ?? null,
        },
      };
    }
    return null;
  },

  /**
   * Logout and end session
   */
  async logout(): Promise<void> {
    await authClient.signOut();
    window.location.href = '/login';
  },

  /**
   * Check if user has an active session
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await authClient.getSession();
    return !!session.data;
  },
};

export default authApi;
