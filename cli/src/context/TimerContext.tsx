import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

export interface TimerState {
  subject: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  workspaceId: string | null;
}

interface TimerContextValue {
  state: TimerState;
  start: (subject: string, minutes: number, workspaceId: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
  toggle: () => void;
}

const initialState: TimerState = {
  subject: '',
  totalSeconds: 0,
  remainingSeconds: 0,
  isRunning: false,
  isPaused: false,
  workspaceId: null,
};

const TimerContext = createContext<TimerContextValue | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TimerState>(initialState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    setState((prev) => {
      if (prev.remainingSeconds <= 1) {
        clearTimer();
        process.stdout.write('\x07'); // Bell sound
        return {
          ...prev,
          remainingSeconds: 0,
          isRunning: false,
          isPaused: false,
        };
      }
      return {
        ...prev,
        remainingSeconds: prev.remainingSeconds - 1,
      };
    });
  }, [clearTimer]);

  useEffect(() => {
    if (state.isRunning && !state.isPaused && state.remainingSeconds > 0) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      clearTimer();
    }

    return clearTimer;
  }, [state.isRunning, state.isPaused, tick, clearTimer]);

  const start = useCallback((subject: string, minutes: number, workspaceId: string) => {
    clearTimer();
    const totalSecs = minutes * 60;
    setState({
      subject,
      totalSeconds: totalSecs,
      remainingSeconds: totalSecs,
      isRunning: true,
      isPaused: false,
      workspaceId,
    });
  }, [clearTimer]);

  const pause = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPaused: true,
    }));
  }, []);

  const resume = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPaused: false,
    }));
  }, []);

  const stop = useCallback(() => {
    clearTimer();
    setState((prev) => ({
      ...prev,
      isRunning: false,
      isPaused: false,
    }));
  }, [clearTimer]);

  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      remainingSeconds: prev.totalSeconds,
      isPaused: false,
    }));
  }, []);

  const toggle = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  }, []);

  const value: TimerContextValue = {
    state,
    start,
    pause,
    resume,
    stop,
    reset,
    toggle,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}
