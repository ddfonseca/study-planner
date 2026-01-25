/**
 * Authentication API using Better Auth
 */
import { createAuthClient } from 'better-auth/client';
import type { User } from '@/types/api';

// In production: empty string (uses Netlify proxy at same domain)
// In development: undefined, so fallback to localhost
const envApiUrl = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL = envApiUrl !== undefined ? envApiUrl : 'http://localhost:3000';

const envFrontendUrl = import.meta.env.VITE_FRONTEND_URL;
const FRONTEND_URL = envFrontendUrl !== undefined ? envFrontendUrl : 'http://localhost:5173';

// Create Better Auth client
export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  basePath: '/api/auth',
  fetchOptions: {
    credentials: 'include', // Required for cross-domain cookies
  },
});

// Error messages in Portuguese
const errorMessages: Record<string, string> = {
  'Invalid email or password': 'Email ou senha inválidos',
  'User not found': 'Usuário não encontrado',
  'User already exists': 'Este email já está cadastrado',
  'Invalid password': 'Senha inválida',
  'Invalid email': 'Email inválido',
  'Email not verified': 'Email não verificado',
  'Password too short': 'A senha deve ter no mínimo 8 caracteres',
  'Password too long': 'A senha deve ter no máximo 128 caracteres',
  'Invalid credentials': 'Credenciais inválidas',
  'Account not found': 'Conta não encontrada',
  'Session expired': 'Sessão expirada',
  'Too many requests': 'Muitas tentativas. Aguarde um momento.',
};

function translateError(message: string | undefined): string {
  if (!message) return 'Erro desconhecido';
  return errorMessages[message] || message;
}

export const authApi = {
  /**
   * Check if email/password auth is available
   */
  isEmailAuthEnabled(): boolean {
    return true;
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
   * Sign in with email and password
   */
  async loginWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    const result = await authClient.signIn.email({
      email,
      password,
      callbackURL: `${FRONTEND_URL}/app/calendar`,
    });

    if (result.error) {
      return { success: false, error: translateError(result.error.message) };
    }

    return { success: true };
  },

  /**
   * Sign up with email and password
   */
  async signUpWithEmail(email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> {
    const result = await authClient.signUp.email({
      email,
      password,
      name,
      callbackURL: `${FRONTEND_URL}/app/calendar`,
    });

    if (result.error) {
      return { success: false, error: translateError(result.error.message) };
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
