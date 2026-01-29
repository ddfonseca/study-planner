/**
 * Study Timer - Stopwatch and Pomodoro timer for tracking study sessions
 */
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SubjectPicker } from '@/components/ui/subject-picker';
import { useRecentSubjects } from '@/hooks/useRecentSubjects';
import { useSessions } from '@/hooks/useSessions';
import { useToast } from '@/hooks/use-toast';
import { useHaptic } from '@/hooks/useHaptic';
import { Play, Square, Clock, Timer, Infinity as InfinityIcon, Maximize2, Minimize2 } from 'lucide-react';
import { TimerOfflineWarning } from './TimerOfflineWarning';
import { cn } from '@/lib/utils';
import { formatDateKey } from '@/lib/utils/date';

const STORAGE_KEY = 'studyTimer';

type TimerMode = 'pomodoro-25' | 'pomodoro-50' | 'stopwatch';

const TIMER_PRESETS: { mode: TimerMode; label: string; sublabel: string; seconds: number }[] = [
  { mode: 'pomodoro-25', label: '25 min', sublabel: 'Pomodoro', seconds: 25 * 60 },
  { mode: 'pomodoro-50', label: '50 min', sublabel: 'Deep Work', seconds: 50 * 60 },
  { mode: 'stopwatch', label: 'Livre', sublabel: 'Cronômetro', seconds: 0 },
];

interface TimerState {
  mode: TimerMode;
  isRunning: boolean;
  seconds: number;
  targetSeconds: number;
  subject: string;
  startTime: number | null;
}

interface StudyTimerProps {
  subjects: string[];
  onRunningChange?: (isRunning: boolean) => void;
  fullscreen?: boolean;
  onFullscreenChange?: (fullscreen: boolean) => void;
}

export function StudyTimer({ subjects, onRunningChange, fullscreen = false, onFullscreenChange }: StudyTimerProps) {
  const { handleAddSession, canModify } = useSessions();
  const { toast } = useToast();
  const { recentSubjects, addRecentSubject } = useRecentSubjects();
  const { trigger: triggerHaptic, triggerPattern } = useHaptic();

  const [mode, setMode] = useState<TimerMode>('pomodoro-25');
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(25 * 60);
  const [targetSeconds, setTargetSeconds] = useState(25 * 60);
  const [subject, setSubject] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(fullscreen);

  // Sync fullscreen state with prop
  useEffect(() => {
    setIsFullscreen(fullscreen);
  }, [fullscreen]);

  // Toggle fullscreen handler
  const toggleFullscreen = () => {
    const newValue = !isFullscreen;
    setIsFullscreen(newValue);
    onFullscreenChange?.(newValue);
  };
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initializedRef = useRef(false);
  const isRunningRef = useRef(isRunning);
  const subjectRef = useRef(subject);
  const modeRef = useRef(mode);
  const handleStartRef = useRef<() => void>(() => {});
  const handleStopRef = useRef<() => void>(() => {});
  const handleCompleteRef = useRef<() => void>(() => {});
  const openPickerRef = useRef<() => void>(() => {});

  // Load saved state from localStorage on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const state: TimerState = JSON.parse(saved);
        setMode(state.mode || 'stopwatch');
        setTargetSeconds(state.targetSeconds || 0);
        if (state.isRunning && state.startTime) {
          const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
          // For countdown modes, calculate remaining time
          if (state.mode === 'pomodoro-25' || state.mode === 'pomodoro-50') {
            const remaining = Math.max(0, state.targetSeconds - elapsed);
            setSeconds(remaining);
          } else {
            setSeconds(elapsed);
          }
          setSubject(state.subject);
          setIsRunning(true);
        } else {
          setSeconds(state.seconds);
          setSubject(state.subject);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    // For countdown modes, startTime tracks when we started the countdown
    // elapsed = targetSeconds - seconds (remaining)
    const elapsedForCountdown = mode === 'stopwatch' ? seconds : targetSeconds - seconds;
    const state: TimerState = {
      mode,
      isRunning,
      seconds,
      targetSeconds,
      subject,
      startTime: isRunning ? Date.now() - elapsedForCountdown * 1000 : null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [mode, isRunning, seconds, targetSeconds, subject]);

  // Keep mode ref in sync
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Notify parent about running state changes
  useEffect(() => {
    onRunningChange?.(isRunning);
    isRunningRef.current = isRunning;
  }, [isRunning, onRunningChange]);

  // Keep subject ref in sync
  useEffect(() => {
    subjectRef.current = subject;
  }, [subject]);

  // Timer interval
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (modeRef.current === 'stopwatch') {
            // Stopwatch: count up
            return s + 1;
          } else {
            // Pomodoro: count down
            if (s <= 1) {
              // Timer complete - will be handled by separate effect
              return 0;
            }
            return s - 1;
          }
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // Recalculate elapsed time when app returns from background (mobile fix)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const state: TimerState = JSON.parse(saved);
            if (state.isRunning && state.startTime) {
              const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
              if (state.mode === 'stopwatch') {
                setSeconds(elapsed);
              } else {
                // Countdown mode: calculate remaining
                const remaining = Math.max(0, state.targetSeconds - elapsed);
                setSeconds(remaining);
              }
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Update page title when timer is running
  useEffect(() => {
    if (isRunning) {
      const displaySeconds = mode === 'stopwatch' ? seconds : seconds;
      const hours = Math.floor(displaySeconds / 3600);
      const minutes = Math.floor((displaySeconds % 3600) / 60);
      const secs = displaySeconds % 60;
      const timeStr = hours > 0
        ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        : `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      const modeIcon = mode === 'stopwatch' ? '⏱️' : '🍅';
      document.title = `${modeIcon} ${timeStr} - ${subject}`;
    } else {
      document.title = 'Horas Líquidas';
    }
    return () => {
      document.title = 'Horas Líquidas';
    };
  }, [isRunning, seconds, subject, mode]);

  // Handle Pomodoro completion (when countdown reaches 0)
  useEffect(() => {
    if (isRunning && mode !== 'stopwatch' && seconds === 0) {
      handleCompleteRef.current();
    }
  }, [isRunning, mode, seconds]);

  const formatTime = (totalSeconds: number, showHours = true): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (showHours || hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const selectMode = (selectedMode: TimerMode) => {
    const preset = TIMER_PRESETS.find(p => p.mode === selectedMode);
    setMode(selectedMode);
    if (preset && preset.seconds > 0) {
      setSeconds(preset.seconds);
      setTargetSeconds(preset.seconds);
    } else {
      setSeconds(0);
      setTargetSeconds(0);
    }
    triggerHaptic('light');
  };

  const handleStart = () => {
    if (!subject.trim()) {
      triggerPattern('error');
      toast({
        title: 'Atenção',
        description: 'Selecione a matéria antes de iniciar',
        variant: 'destructive',
      });
      return;
    }
    // For pomodoro modes, make sure we have the correct starting time
    if (mode !== 'stopwatch' && seconds === 0) {
      const preset = TIMER_PRESETS.find(p => p.mode === mode);
      if (preset) {
        setSeconds(preset.seconds);
        setTargetSeconds(preset.seconds);
      }
    }
    triggerHaptic('medium');
    setIsRunning(true);
  };

  // Called when Pomodoro countdown reaches 0
  const handleComplete = useCallback(async () => {
    setIsRunning(false);

    // Calculate studied minutes from targetSeconds (full duration)
    const minutes = Math.floor(targetSeconds / 60);

    // Notify user
    triggerPattern('success');

    // Play notification sound
    const audio = new Audio('/sounds/bell.mp3');
    audio.play().catch(() => {
      // Ignore autoplay errors (user hasn't interacted yet)
    });

    // Try to show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🍅 Pomodoro completo!', {
        body: `${minutes} minutos de ${subject} finalizados. Hora da pausa!`,
        icon: '/favicon.png',
      });
    }

    // Save session
    if (minutes > 0) {
      try {
        const today = formatDateKey(new Date());
        await handleAddSession(today, subject.trim(), minutes);
        toast({
          title: '🍅 Pomodoro completo!',
          description: `${minutes} minutos de ${subject} registrados. Hora da pausa!`,
        });
      } catch (err) {
        triggerPattern('error');
        toast({
          title: 'Erro',
          description: err instanceof Error ? err.message : 'Falha ao salvar sessão',
          variant: 'destructive',
        });
      }
    }

    // Reset to initial state for selected mode
    const preset = TIMER_PRESETS.find(p => p.mode === mode);
    setSeconds(preset?.seconds || 0);
    setSubject('');
    localStorage.removeItem(STORAGE_KEY);
  }, [mode, targetSeconds, subject, handleAddSession, toast, triggerPattern]);

  const handleStop = async () => {
    setIsRunning(false);

    // For stopwatch: minutes = seconds elapsed
    // For pomodoro: minutes = targetSeconds - seconds remaining (time studied)
    const studiedMinutes = mode === 'stopwatch'
      ? Math.floor(seconds / 60)
      : Math.floor((targetSeconds - seconds) / 60);

    if (studiedMinutes > 0) {
      try {
        const today = formatDateKey(new Date());
        await handleAddSession(today, subject.trim(), studiedMinutes);
        triggerPattern('success');
        toast({
          title: 'Sessão salva!',
          description: `${studiedMinutes} minutos de ${subject} registrados`,
        });
      } catch (err) {
        triggerPattern('error');
        toast({
          title: 'Erro',
          description: err instanceof Error ? err.message : 'Falha ao salvar sessão',
          variant: 'destructive',
        });
      }
    } else {
      triggerPattern('warning');
      toast({
        title: 'Tempo muito curto',
        description: 'Estude pelo menos 1 minuto para registrar',
      });
    }

    // Reset to initial state for selected mode
    const preset = TIMER_PRESETS.find(p => p.mode === mode);
    setSeconds(preset?.seconds || 0);
    setSubject('');
    localStorage.removeItem(STORAGE_KEY);
  };

  // Keep refs in sync with handlers
  useLayoutEffect(() => {
    handleStartRef.current = handleStart;
    handleStopRef.current = handleStop;
    handleCompleteRef.current = handleComplete;
    openPickerRef.current = () => setIsPickerOpen(true);
  });

  // Listen for keyboard shortcut to toggle timer (smart behavior)
  // - If timer running: stop and save
  // - If no subject selected: open the subject picker
  // - If subject selected: start the timer
  useEffect(() => {
    const handleToggleTimer = () => {
      if (isRunningRef.current) {
        // Timer is running - stop it
        handleStopRef.current();
      } else if (!subjectRef.current.trim()) {
        // No subject - open the picker
        openPickerRef.current();
      } else {
        // Has subject - start the timer
        handleStartRef.current();
      }
    };

    window.addEventListener('shortcut:toggleTimer', handleToggleTimer);
    return () => window.removeEventListener('shortcut:toggleTimer', handleToggleTimer);
  }, []);

  // Calculate progress for Pomodoro modes (0-100%)
  const progress = mode !== 'stopwatch' && targetSeconds > 0
    ? Math.round(((targetSeconds - seconds) / targetSeconds) * 100)
    : 0;

  return (
    <Card data-tour="study-timer">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            "font-medium flex items-center gap-2",
            isFullscreen ? "text-base" : "text-sm"
          )}>
            {mode === 'stopwatch' ? (
              <Clock className={isFullscreen ? "h-5 w-5" : "h-4 w-4"} />
            ) : (
              <Timer className={isFullscreen ? "h-5 w-5" : "h-4 w-4"} />
            )}
            Estudar Agora
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="h-8 w-8 p-0"
            title={isFullscreen ? "Minimizar" : "Expandir"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className={cn("space-y-4", isFullscreen && "space-y-6")}>
        {/* Mode selection - only show when not running */}
        {!isRunning && (
          <div className={cn("grid grid-cols-3", isFullscreen ? "gap-3 max-w-md mx-auto" : "gap-2")}>
            {TIMER_PRESETS.map((preset) => (
              <button
                key={preset.mode}
                onClick={() => selectMode(preset.mode)}
                disabled={!canModify}
                className={cn(
                  'flex flex-col items-center justify-center rounded-lg border-2 transition-all',
                  'hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20',
                  isFullscreen ? 'p-3' : 'p-2',
                  mode === preset.mode
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-muted bg-muted/30 text-muted-foreground',
                  !canModify && 'opacity-50 cursor-not-allowed'
                )}
              >
                {preset.mode === 'stopwatch' ? (
                  <InfinityIcon className={cn("mb-1", isFullscreen ? "h-5 w-5" : "h-4 w-4")} />
                ) : (
                  <span className={cn("mb-1", isFullscreen ? "text-base" : "text-sm")}>🍅</span>
                )}
                <span className={cn("font-medium", isFullscreen ? "text-base" : "text-sm")}>{preset.label}</span>
                <span className={cn("opacity-70", isFullscreen ? "text-xs" : "text-[10px]")}>{preset.sublabel}</span>
              </button>
            ))}
          </div>
        )}

        {/* Timer display */}
        <div className={cn("text-center", isFullscreen ? "space-y-4" : "space-y-2")}>
          {isRunning && subject && (
            <p className={cn(
              "text-muted-foreground font-medium",
              isFullscreen ? "text-lg" : "text-sm"
            )}>{subject}</p>
          )}
          <span
            className={cn(
              'font-mono font-bold tabular-nums',
              isFullscreen ? 'text-6xl md:text-7xl' : 'text-4xl',
              isRunning ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {mode === 'stopwatch' ? formatTime(seconds, true) : formatTime(seconds, false)}
          </span>

          {/* Progress bar for Pomodoro modes */}
          {isRunning && mode !== 'stopwatch' && (
            <div className={cn("space-y-1", isFullscreen && "max-w-sm mx-auto")}>
              <div className={cn(
                "bg-muted rounded-full overflow-hidden",
                isFullscreen ? "h-3" : "h-2"
              )}>
                <div
                  className="h-full bg-primary transition-all duration-1000 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className={cn(
                "text-muted-foreground",
                isFullscreen ? "text-sm" : "text-xs"
              )}>{progress}% concluído</p>
            </div>
          )}
        </div>

        {/* Offline warning */}
        <TimerOfflineWarning />

        {/* Subject input - only show when not running */}
        {!isRunning && (
          <div className={cn(isFullscreen && "max-w-md mx-auto")}>
            <SubjectPicker
              value={subject}
              onValueChange={setSubject}
              subjects={subjects}
              recentSubjects={recentSubjects}
              onSubjectUsed={addRecentSubject}
              placeholder="Selecione a matéria..."
              searchPlaceholder="Buscar..."
              emptyMessage="Nenhuma matéria"
              disabled={isRunning || !canModify}
              open={isPickerOpen}
              onOpenChange={setIsPickerOpen}
            />
          </div>
        )}

        {/* Start/Stop button */}
        <div className={cn(isFullscreen && "max-w-md mx-auto")}>
          {!canModify ? (
            <p className={cn(
              "text-amber-600 dark:text-amber-400 text-center",
              isFullscreen ? "text-sm" : "text-xs"
            )}>
              Selecione um workspace para usar o timer.
            </p>
          ) : !isRunning ? (
            <Button onClick={handleStart} className="w-full" size="lg">
              <Play className={cn("mr-2", isFullscreen ? "h-5 w-5" : "h-4 w-4")} />
              {mode === 'stopwatch' ? 'Iniciar' : 'Iniciar Pomodoro'}
            </Button>
          ) : (
            <Button
              onClick={handleStop}
              variant="destructive"
              className="w-full"
              size="lg"
            >
              <Square className={cn("mr-2", isFullscreen ? "h-5 w-5" : "h-4 w-4")} />
              Parar e Salvar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default StudyTimer;
