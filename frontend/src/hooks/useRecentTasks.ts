import { useState, useCallback, useMemo } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';

const STORAGE_KEY = 'recentTasks';
const MAX_RECENT = 5;

interface RecentTasksStore {
  [workspaceId: string]: string[];
}

function getStoredTasks(workspaceId: string | null): string[] {
  if (!workspaceId) return [];
  try {
    // Try new key first, then fall back to old key for migration
    let stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      stored = localStorage.getItem('recentSubjects');
    }
    if (stored) {
      const data: RecentTasksStore = JSON.parse(stored);
      return data[workspaceId] || [];
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

/**
 * Hook to manage recently used tasks per workspace
 * Stores in localStorage, max 5 tasks per workspace
 */
export function useRecentTasks() {
  const { currentWorkspaceId } = useWorkspaceStore();

  // Use a version counter to trigger re-reads from localStorage
  const [version, setVersion] = useState(0);

  // Derive recent tasks from localStorage based on workspace and version
  const recentTasks = useMemo(
    () => getStoredTasks(currentWorkspaceId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentWorkspaceId, version]
  );

  const addRecentTask = useCallback(
    (task: string) => {
      if (!currentWorkspaceId || !task.trim()) return;

      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const data: RecentTasksStore = stored ? JSON.parse(stored) : {};
        const current = data[currentWorkspaceId] || [];

        // Remove if already exists, then add to front
        const filtered = current.filter(
          (s) => s.toLowerCase() !== task.toLowerCase()
        );
        const updated = [task, ...filtered].slice(0, MAX_RECENT);

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
    recentTasks,
    addRecentTask,
  };
}

export default useRecentTasks;
