import { mkdir } from 'fs/promises';
import { CONFIG_DIR, SESSION_FILE, loadSettings } from '../config';

export interface StoredSession {
  token: string;
  expiresAt: string;
  userId?: string;
  email?: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

export interface SessionInfo {
  session: {
    id: string;
    token: string;
    expiresAt: string;
  };
  user: User;
}

/**
 * Load session from local storage
 */
export async function loadSession(): Promise<StoredSession | null> {
  try {
    const file = Bun.file(SESSION_FILE);
    if (await file.exists()) {
      const content = await file.text();
      const session = JSON.parse(content) as StoredSession;

      // Check if session is expired
      if (new Date(session.expiresAt) < new Date()) {
        await clearSession();
        return null;
      }

      return session;
    }
  } catch {
    // Ignore errors
  }
  return null;
}

/**
 * Save session to local storage
 */
export async function saveSession(session: StoredSession): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  await Bun.write(SESSION_FILE, JSON.stringify(session, null, 2));
}

/**
 * Clear the stored session
 */
export async function clearSession(): Promise<void> {
  const { unlink } = await import('fs/promises');
  try {
    await unlink(SESSION_FILE);
  } catch {
    // Ignore if file doesn't exist
  }
}

/**
 * Verify session with backend
 */
export async function verifySession(token: string): Promise<SessionInfo | null> {
  const settings = await loadSettings();
  const url = `${settings.backendUrl}/api/auth/get-session`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        cookie: `better-auth.session_token=${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Session verification failed: ${response.status} - ${text}`);
      return null;
    }

    const data = (await response.json()) as SessionInfo | null;
    if (data?.session && data?.user) {
      return data;
    }

    console.error('Session response missing session or user data');
    return null;
  } catch (err) {
    console.error(`Failed to verify session: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return null;
  }
}

/**
 * Get valid session or null
 */
export async function getValidSession(): Promise<{ token: string; user: User } | null> {
  const stored = await loadSession();
  if (!stored) return null;

  const sessionInfo = await verifySession(stored.token);
  if (!sessionInfo) {
    await clearSession();
    return null;
  }

  return {
    token: stored.token,
    user: sessionInfo.user,
  };
}

/**
 * Generate authentication URL for browser login
 */
export async function getAuthUrl(): Promise<string> {
  const settings = await loadSettings();
  // This URL should point to the frontend auth page
  const frontendUrl = settings.backendUrl.replace(':3333', ':5173');
  return `${frontendUrl}/auth/cli-login`;
}

/**
 * Start local server to receive auth callback
 */
export async function startAuthServer(): Promise<{ port: number; waitForToken: () => Promise<string> }> {
  let resolveToken: (token: string) => void;
  const tokenPromise = new Promise<string>((resolve) => {
    resolveToken = resolve;
  });

  const server = Bun.serve({
    port: 0, // Random available port
    fetch(req) {
      const url = new URL(req.url);

      if (url.pathname === '/callback') {
        const token = url.searchParams.get('token');
        const expiresAt = url.searchParams.get('expiresAt');

        if (token && expiresAt) {
          resolveToken!(token);

          // Return success HTML
          return new Response(
            `<!DOCTYPE html>
            <html>
            <head><title>Study CLI - Login Successful</title></head>
            <body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
              <div style="text-align: center;">
                <h1 style="color: #22c55e;">✓ Login Successful!</h1>
                <p>You can close this window and return to the terminal.</p>
              </div>
            </body>
            </html>`,
            {
              headers: { 'Content-Type': 'text/html' },
              status: 200,
            }
          );
        }

        return new Response('Missing token', { status: 400 });
      }

      return new Response('Not found', { status: 404 });
    },
  });

  return {
    port: server.port as number,
    waitForToken: async () => {
      const token = await tokenPromise;
      server.stop();
      return token;
    },
  };
}
