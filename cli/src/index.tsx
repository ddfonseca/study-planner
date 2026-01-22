#!/usr/bin/env bun
import React, { useState, useEffect } from 'react';
import { render, Box, Text, useApp } from 'ink';
import Spinner from 'ink-spinner';
import TextInput from 'ink-text-input';
import {
  getValidSession,
  saveSession,
  clearSession,
  getAuthUrl,
  startAuthServer,
  User,
} from './auth/session';
import { Dashboard } from './components/Dashboard';
import { loadSettings } from './config';
import { TimerProvider } from './context/TimerContext';

type AppState = 'loading' | 'login' | 'waiting-auth' | 'authenticated';

function App() {
  const { exit } = useApp();
  const [state, setState] = useState<AppState>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string>('');
  const [manualToken, setManualToken] = useState('');

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    setState('loading');
    setError(null);

    try {
      const session = await getValidSession();
      if (session) {
        setToken(session.token);
        setUser(session.user);
        setState('authenticated');
      } else {
        setState('login');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check session');
      setState('login');
    }
  };

  const startLogin = async () => {
    try {
      setState('waiting-auth');

      // Start local server for callback
      const { port, waitForToken } = await startAuthServer();

      // Generate auth URL with callback
      const settings = await loadSettings();
      const frontendUrl = settings.backendUrl.replace(':3333', ':5173');
      const callbackUrl = `http://localhost:${port}/callback`;
      const url = `${frontendUrl}/auth/cli-login?callback=${encodeURIComponent(callbackUrl)}`;
      setAuthUrl(url);

      // Open browser (platform specific)
      const { exec } = await import('child_process');
      const platform = process.platform;
      const command =
        platform === 'darwin'
          ? `open "${url}"`
          : platform === 'win32'
            ? `start "${url}"`
            : `xdg-open "${url}"`;

      exec(command);

      // Wait for token
      const receivedToken = await waitForToken();

      // Verify and save
      await saveSession({
        token: receivedToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      await checkSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setState('login');
    }
  };

  const handleManualToken = async () => {
    if (!manualToken.trim()) return;

    try {
      setState('loading');
      // Decode URL-encoded token if needed
      const decodedToken = decodeURIComponent(manualToken.trim());

      await saveSession({
        token: decodedToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      await checkSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid token');
      setState('login');
    }
  };

  const handleLogout = async () => {
    await clearSession();
    setToken(null);
    setUser(null);
    setState('login');
  };

  // Loading state
  if (state === 'loading') {
    return (
      <Box padding={1}>
        <Spinner type="dots" />
        <Text> Loading...</Text>
      </Box>
    );
  }

  // Login state
  if (state === 'login') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text bold color="cyan">
            Study Planner CLI
          </Text>
        </Box>

        {error && (
          <Box marginBottom={1}>
            <Text color="red">Error: {error}</Text>
          </Box>
        )}

        <Box marginBottom={1}>
          <Text>You are not logged in.</Text>
        </Box>

        <Box marginBottom={1} flexDirection="column">
          <Text bold>Options:</Text>
          <Text>1. Press Enter to open browser login</Text>
          <Text>2. Paste a session token below:</Text>
        </Box>

        <Box>
          <Text>Token: </Text>
          <TextInput
            value={manualToken}
            onChange={setManualToken}
            onSubmit={manualToken ? handleManualToken : startLogin}
          />
        </Box>

        <Box marginTop={1}>
          <Text color="gray">Press Ctrl+C to exit</Text>
        </Box>
      </Box>
    );
  }

  // Waiting for auth
  if (state === 'waiting-auth') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text bold color="cyan">
            Study Planner CLI
          </Text>
        </Box>

        <Box marginBottom={1}>
          <Spinner type="dots" />
          <Text> Waiting for authentication...</Text>
        </Box>

        <Box marginBottom={1} flexDirection="column">
          <Text>A browser window should have opened.</Text>
          <Text>Please log in to continue.</Text>
        </Box>

        {authUrl && (
          <Box marginBottom={1} flexDirection="column">
            <Text color="gray">If the browser didn't open, visit:</Text>
            <Text color="blue">{authUrl}</Text>
          </Box>
        )}

        <Box marginTop={1}>
          <Text color="gray">Press Ctrl+C to cancel</Text>
        </Box>
      </Box>
    );
  }

  // Authenticated - show dashboard
  if (state === 'authenticated' && token && user) {
    return (
      <TimerProvider>
        <Dashboard token={token} user={user} onLogout={handleLogout} />
      </TimerProvider>
    );
  }

  return null;
}

// Main entry point
render(<App />);
