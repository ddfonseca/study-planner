/**
 * Hook for detecting online/offline status
 * Uses browser's navigator.onLine and online/offline events
 */
import { useState, useEffect, useCallback } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const handleOnline = useCallback(() => {
    setIsOnline(true);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return isOnline;
}

export default useOnlineStatus;
