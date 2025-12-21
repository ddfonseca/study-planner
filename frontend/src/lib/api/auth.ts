/**
 * Authentication API using Better Auth
 */
import { createAuthClient } from 'better-auth/client';
import type { User } from '@/types/api';

// In production: empty string (uses Netlify proxy at same domain)
// In development: undefined, so fallback to localhost
const envApiUrl = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL = envApiUrl !== undefined ? envApiUrl : 'http://localhost:3000';
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';

// Create Better Auth client
export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  basePath: '/api/auth',
  fetchOptions: {
    credentials: 'include', // Required for cross-domain cookies
  },
});

export const authApi = {
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
