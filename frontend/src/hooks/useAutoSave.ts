/**
 * Hook for auto-saving with debounce and retry logic
 * Features:
 * - Debounced save to avoid excessive API calls
 * - Automatic retry with exponential backoff on failure
 * - Offline detection - pauses retries when offline
 * - Manual retry trigger
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useOnlineStatus } from './useOnlineStatus';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions<T> {
  /** The save function to call */
  onSave: (data: T) => Promise<void>;
  /** Debounce delay in ms (default: 1000) */
  debounceMs?: number;
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay for exponential backoff in ms (default: 1000) */
  retryDelayMs?: number;
}

interface UseAutoSaveReturn<T> {
  /** Current save status */
  status: AutoSaveStatus;
  /** Last saved timestamp */
  lastSavedAt: Date | null;
  /** Error message if status is 'error' */
  errorMessage: string | null;
  /** Number of retry attempts made */
  retryCount: number;
  /** Whether currently online */
  isOnline: boolean;
  /** Trigger a save with debounce */
  save: (data: T) => void;
  /** Trigger an immediate save without debounce */
  saveNow: (data: T) => Promise<void>;
  /** Retry the last failed save */
  retry: () => void;
  /** Reset status to idle */
  reset: () => void;
}

export function useAutoSave<T>({
  onSave,
  debounceMs = 1000,
  maxRetries = 3,
  retryDelayMs = 1000,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn<T> {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const isOnline = useOnlineStatus();

  // Refs to persist across renders
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDataRef = useRef<T | null>(null);
  const isMountedRef = useRef(true);
  const onSaveRef = useRef(onSave);
  const performSaveRef = useRef<((data: T, currentRetry: number) => Promise<void>) | undefined>(undefined);

  // Keep onSave ref up to date
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Perform the actual save with retry logic
  const performSave = useCallback(
    async (data: T, currentRetry: number = 0): Promise<void> => {
      if (!isMountedRef.current) return;

      // Don't attempt save if offline
      if (!navigator.onLine) {
        setStatus('error');
        setErrorMessage('Sem conexão com a internet');
        lastDataRef.current = data;
        return;
      }

      setStatus('saving');
      setErrorMessage(null);

      try {
        await onSaveRef.current(data);

        if (!isMountedRef.current) return;

        setStatus('saved');
        setLastSavedAt(new Date());
        setRetryCount(0);
        lastDataRef.current = null;

        // Reset to idle after a short delay
        setTimeout(() => {
          if (isMountedRef.current) {
            setStatus('idle');
          }
        }, 2000);
      } catch (error) {
        if (!isMountedRef.current) return;

        const message = error instanceof Error ? error.message : 'Falha ao salvar';

        // Check if we should retry
        if (currentRetry < maxRetries) {
          const delay = retryDelayMs * Math.pow(2, currentRetry);
          setRetryCount(currentRetry + 1);
          lastDataRef.current = data;

          // Schedule retry using the ref to avoid circular dependency
          const nextRetry = currentRetry + 1;
          retryTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current && navigator.onLine && performSaveRef.current) {
              performSaveRef.current(data, nextRetry);
            }
          }, delay);
        } else {
          // Max retries reached
          setStatus('error');
          setErrorMessage(message);
          setRetryCount(maxRetries);
          lastDataRef.current = data;
        }
      }
    },
    [maxRetries, retryDelayMs]
  );

  // Keep performSave ref updated for recursive calls
  useEffect(() => {
    performSaveRef.current = performSave;
  }, [performSave]);

  // Debounced save
  const save = useCallback(
    (data: T) => {
      lastDataRef.current = data;

      // Clear any pending debounce
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Clear any pending retry
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        setRetryCount(0);
        performSave(data, 0);
      }, debounceMs);
    },
    [debounceMs, performSave]
  );

  // Immediate save without debounce
  const saveNow = useCallback(
    async (data: T) => {
      // Clear any pending debounce
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Clear any pending retry
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      lastDataRef.current = data;
      setRetryCount(0);
      await performSave(data, 0);
    },
    [performSave]
  );

  // Manual retry
  const retry = useCallback(() => {
    if (lastDataRef.current !== null && status === 'error') {
      // Clear any pending retry
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      setRetryCount(0);
      performSave(lastDataRef.current, 0);
    }
  }, [status, performSave]);

  // Reset status
  const reset = useCallback(() => {
    setStatus('idle');
    setErrorMessage(null);
    setRetryCount(0);
    lastDataRef.current = null;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
  }, []);

  // Auto-retry when coming back online
  useEffect(() => {
    if (isOnline && status === 'error' && lastDataRef.current !== null) {
      // Wait a moment before retrying when coming back online
      const timeout = setTimeout(() => {
        if (isMountedRef.current && lastDataRef.current !== null) {
          setRetryCount(0);
          performSave(lastDataRef.current, 0);
        }
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [isOnline, status, performSave]);

  return {
    status,
    lastSavedAt,
    errorMessage,
    retryCount,
    isOnline,
    save,
    saveNow,
    retry,
    reset,
  };
}

export default useAutoSave;
