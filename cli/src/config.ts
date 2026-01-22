import { homedir } from 'os';
import { join } from 'path';

export const CONFIG_DIR = join(homedir(), '.study-cli');
export const SESSION_FILE = join(CONFIG_DIR, 'session');
export const SETTINGS_FILE = join(CONFIG_DIR, 'settings.json');

export interface Settings {
  backendUrl: string;
  defaultWorkspaceId?: string;
}

export const DEFAULT_SETTINGS: Settings = {
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
};

export async function loadSettings(): Promise<Settings> {
  try {
    const file = Bun.file(SETTINGS_FILE);
    if (await file.exists()) {
      const content = await file.text();
      return { ...DEFAULT_SETTINGS, ...JSON.parse(content) };
    }
  } catch {
    // Ignore errors, return defaults
  }
  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Settings): Promise<void> {
  const { mkdir } = await import('fs/promises');
  await mkdir(CONFIG_DIR, { recursive: true });
  await Bun.write(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}
