import { useState, useCallback, useMemo } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';

const STORAGE_KEY = 'recentSubjects';
const MAX_RECENT = 5;

interface RecentSubjectsStore {
  [workspaceId: string]: string[];
}

function getStoredSubjects(workspaceId: string | null): string[] {
  if (!workspaceId) return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data: RecentSubjectsStore = JSON.parse(stored);
      return data[workspaceId] || [];
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

/**
 * Hook to manage recently used subjects per workspace
 * Stores in localStorage, max 5 subjects per workspace
 */
export function useRecentSubjects() {
  const { currentWorkspaceId } = useWorkspaceStore();

  // Use a version counter to trigger re-reads from localStorage
  const [version, setVersion] = useState(0);

  // Derive recent subjects from localStorage based on workspace and version
  const recentSubjects = useMemo(
    () => getStoredSubjects(currentWorkspaceId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentWorkspaceId, version]
  );

  const addRecentSubject = useCallback(
    (subject: string) => {
      if (!currentWorkspaceId || !subject.trim()) return;

      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const data: RecentSubjectsStore = stored ? JSON.parse(stored) : {};
        const current = data[currentWorkspaceId] || [];

        // Remove if already exists, then add to front
        const filtered = current.filter(
          (s) => s.toLowerCase() !== subject.toLowerCase()
        );
        const updated = [subject, ...filtered].slice(0, MAX_RECENT);

        data[currentWorkspaceId] = updated;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

        // Trigger re-read
        setVersion((v) => v + 1);
      } catch {
        // Ignore storage errors
      }
    },
    [currentWorkspaceId]
  );

  return {
    recentSubjects,
    addRecentSubject,
  };
}

export default useRecentSubjects;
