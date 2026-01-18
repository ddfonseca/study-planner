/**
 * Study Timer - Stopwatch and Pomodoro timer for tracking study sessions
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { useSessions } from '@/hooks/useSessions';
import { useToast } from '@/hooks/use-toast';
import { Play, Square, Clock, Timer, RotateCcw, Coffee, Brain } from 'lucide-react';

const STORAGE_KEY = 'studyTimer';

// Pomodoro constants
const POMODORO_WORK_MINUTES = 25;
const POMODORO_BREAK_MINUTES = 5;
const POMODORO_LONG_BREAK_MINUTES = 15;
const POMODOROS_UNTIL_LONG_BREAK = 4;

type TimerMode = 'stopwatch' | 'pomodoro';
type PomodoroPhase = 'work' | 'break' | 'longBreak';

interface TimerState {
  isRunning: boolean;
  seconds: number;
  subject: string;
  startTime: number | null;
  mode: TimerMode;
  pomodoroPhase: PomodoroPhase;
  pomodorosCompleted: number;
  totalWorkMinutes: number;
}

interface StudyTimerProps {
  subjects: string[];
  onRunningChange?: (isRunning: boolean) => void;
}

export function StudyTimer({ subjects, onRunningChange }: StudyTimerProps) {
  const { handleAddSession, canModify } = useSessions();
  const { toast } = useToast();

  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [subject, setSubject] = useState('');
  const [mode, setMode] = useState<TimerMode>('stopwatch');
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>('work');
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0);
  const [totalWorkMinutes, setTotalWorkMinutes] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initializedRef = useRef(false);

  // Get initial seconds for pomodoro phases
  const getPomodoroInitialSeconds = useCallback((phase: PomodoroPhase): number => {
    switch (phase) {
      case 'work':
        return POMODORO_WORK_MINUTES * 60;
      case 'break':
        return POMODORO_BREAK_MINUTES * 60;
      case 'longBreak':
        return POMODORO_LONG_BREAK_MINUTES * 60;
    }
  }, []);

  // Play notification sound
  const playNotification = useCallback(() => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleVz/PJT/4NqkXxEJQJ3p+M5xIQxZsejyy30nHmrK+O3DfyMga8709L1+HBxnx/buxX8jIWvH9PO+gBwcZsb07sV/IiBqx/TzvYAbHGfH9O7FfyMga8b08r1/HBxnxvXuxH8jH2rH9PO9gBscZ8f07sV/IyBrxvTyvX8cHGfG9e7EfyIgasf0872AGxxox/TuxH8jH2vH9PK9fxwcZ8b17sR/Ih9qxvTzvYAbG2fH9O7EfyIfasf0871/GxxnxvXuxH8iH2rH9PO9gBsbZ8f07sR/Ih9qxvTyvX8bG2fH9e7EfyIgasf08r2AGxtox/TuxH8iH2rH9PO9fxscZ8b17sR/Ih9qx/TzvYAbG2fH9O7EfyIfasf08r1/GxtnxvXuxH8iH2rH9PO9gBsbZ8f07sR/Ih9rx/TyvX8bHGfG9e7EfyIfasf0872AG');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {
      // Silently fail if audio fails
    }
  }, []);

  // Load saved state from localStorage on mount
  /* eslint-disable react-hooks/set-state-in-effect -- Initialization from localStorage on mount is intentional */
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const state: TimerState = JSON.parse(saved);
        setMode(state.mode || 'stopwatch');
        setPomodoroPhase(state.pomodoroPhase || 'work');
        setPomodorosCompleted(state.pomodorosCompleted || 0);
        setTotalWorkMinutes(state.totalWorkMinutes || 0);
        setSubject(state.subject);

        if (state.isRunning && state.startTime) {
          const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
          if (state.mode === 'pomodoro') {
            // For pomodoro, subtract elapsed time from saved seconds
            const remaining = Math.max(0, state.seconds - elapsed);
            setSeconds(remaining);
          } else {
            setSeconds(state.seconds + elapsed);
          }
          setIsRunning(true);
        } else {
          setSeconds(state.seconds);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Save state to localStorage
  useEffect(() => {
    const state: TimerState = {
      isRunning,
      seconds,
      subject,
      startTime: isRunning ? Date.now() : null,
      mode,
      pomodoroPhase,
      pomodorosCompleted,
      totalWorkMinutes,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [isRunning, seconds, subject, mode, pomodoroPhase, pomodorosCompleted, totalWorkMinutes]);

  // Notify parent about running state changes
  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  // Handle pomodoro completion - called from interval
  const handlePomodoroComplete = useCallback(() => {
    playNotification();

    if (pomodoroPhase === 'work') {
      // Work session completed
      const newPomodorosCompleted = pomodorosCompleted + 1;
      setPomodorosCompleted(newPomodorosCompleted);
      setTotalWorkMinutes((prev) => prev + POMODORO_WORK_MINUTES);

      // Determine next break type
      const isLongBreak = newPomodorosCompleted % POMODOROS_UNTIL_LONG_BREAK === 0;
      const nextPhase: PomodoroPhase = isLongBreak ? 'longBreak' : 'break';

      toast({
        title: 'Pomodoro completo!',
        description: isLongBreak
          ? `${POMODOROS_UNTIL_LONG_BREAK} pomodoros! Hora de uma pausa longa.`
          : 'Hora de uma pausa curta.',
      });

      setPomodoroPhase(nextPhase);
      setSeconds(getPomodoroInitialSeconds(nextPhase));
    } else {
      // Break completed
      toast({
        title: 'Pausa terminou!',
        description: 'Pronto para mais um pomodoro?',
      });

      setPomodoroPhase('work');
      setSeconds(getPomodoroInitialSeconds('work'));
    }

    setIsRunning(false);
  }, [pomodoroPhase, pomodorosCompleted, toast, playNotification, getPomodoroInitialSeconds]);

  // Timer interval
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (mode === 'pomodoro') {
            // Countdown for pomodoro
            if (s <= 1) {
              // Schedule completion callback (don't call setState directly here)
              setTimeout(() => handlePomodoroComplete(), 0);
              return 0;
            }
            return s - 1;
          }
          // Count up for stopwatch
          return s + 1;
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
  }, [isRunning, mode, handlePomodoroComplete]);

  // Update page title when timer is running
  useEffect(() => {
    if (isRunning) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      const timeStr = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      const phaseLabel = mode === 'pomodoro'
        ? pomodoroPhase === 'work' ? '' : pomodoroPhase === 'break' ? ' (pausa)' : ' (pausa longa)'
        : '';
      document.title = `${timeStr}${phaseLabel} - ${subject}`;
    } else {
      document.title = 'Horas Liquidas';
    }
    return () => {
      document.title = 'Horas Liquidas';
    };
  }, [isRunning, seconds, subject, mode, pomodoroPhase]);

  const formatTime = (totalSeconds: number): string => {
    if (mode === 'pomodoro') {
      const minutes = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleModeChange = (newMode: TimerMode) => {
    if (isRunning) return;
    setMode(newMode);
    if (newMode === 'pomodoro') {
      setSeconds(getPomodoroInitialSeconds('work'));
      setPomodoroPhase('work');
    } else {
      setSeconds(0);
    }
  };

  const handleStart = () => {
    if (!subject.trim()) {
      toast({
        title: 'Atencao',
        description: 'Digite a materia antes de iniciar',
        variant: 'destructive',
      });
      return;
    }
    setIsRunning(true);
  };

  const handleStop = async () => {
    setIsRunning(false);

    let minutesToSave = 0;
    if (mode === 'stopwatch') {
      minutesToSave = Math.floor(seconds / 60);
    } else {
      // For pomodoro, save accumulated work minutes
      minutesToSave = totalWorkMinutes;
      // Also add partial time from current work session
      if (pomodoroPhase === 'work') {
        const initialWorkSeconds = POMODORO_WORK_MINUTES * 60;
        const workedSeconds = initialWorkSeconds - seconds;
        minutesToSave += Math.floor(workedSeconds / 60);
      }
    }

    if (minutesToSave > 0) {
      try {
        const today = new Date().toISOString().split('T')[0];
        await handleAddSession(today, subject.trim(), minutesToSave);
        toast({
          title: 'Sessao salva!',
          description: `${minutesToSave} minutos de ${subject} registrados`,
        });
      } catch (err) {
        toast({
          title: 'Erro',
          description: err instanceof Error ? err.message : 'Falha ao salvar sessao',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Tempo muito curto',
        description: 'Estude pelo menos 1 minuto para registrar',
      });
    }

    // Reset
    setSeconds(mode === 'pomodoro' ? getPomodoroInitialSeconds('work') : 0);
    setSubject('');
    setPomodoroPhase('work');
    setPomodorosCompleted(0);
    setTotalWorkMinutes(0);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (mode === 'pomodoro') {
      setSeconds(getPomodoroInitialSeconds(pomodoroPhase));
    } else {
      setSeconds(0);
    }
  };

  const handleSkipBreak = () => {
    if (pomodoroPhase !== 'work') {
      setPomodoroPhase('work');
      setSeconds(getPomodoroInitialSeconds('work'));
      setIsRunning(false);
    }
  };

  // Get phase label and color
  const getPhaseInfo = () => {
    switch (pomodoroPhase) {
      case 'work':
        return { label: 'Foco', color: 'text-primary', icon: Brain };
      case 'break':
        return { label: 'Pausa', color: 'text-green-500', icon: Coffee };
      case 'longBreak':
        return { label: 'Pausa Longa', color: 'text-blue-500', icon: Coffee };
    }
  };

  const phaseInfo = getPhaseInfo();
  const PhaseIcon = phaseInfo.icon;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Estudar Agora
          </div>
          {/* Mode toggle */}
          <div className="flex gap-1">
            <Button
              variant={mode === 'stopwatch' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => handleModeChange('stopwatch')}
              disabled={isRunning}
            >
              <Clock className="h-3 w-3 mr-1" />
              Livre
            </Button>
            <Button
              variant={mode === 'pomodoro' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => handleModeChange('pomodoro')}
              disabled={isRunning}
            >
              <Timer className="h-3 w-3 mr-1" />
              Pomodoro
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pomodoro phase indicator */}
        {mode === 'pomodoro' && (
          <div className="flex items-center justify-center gap-2">
            <PhaseIcon className={`h-4 w-4 ${phaseInfo.color}`} />
            <span className={`text-sm font-medium ${phaseInfo.color}`}>
              {phaseInfo.label}
            </span>
            {pomodorosCompleted > 0 && (
              <span className="text-xs text-muted-foreground ml-2">
                ({pomodorosCompleted} pomodoro{pomodorosCompleted > 1 ? 's' : ''})
              </span>
            )}
          </div>
        )}

        {/* Timer display */}
        <div className="text-center">
          <span
            className={`text-3xl font-mono font-bold ${
              isRunning
                ? mode === 'pomodoro' && pomodoroPhase !== 'work'
                  ? phaseInfo.color
                  : 'text-primary'
                : 'text-muted-foreground'
            }`}
          >
            {formatTime(seconds)}
          </span>
        </div>

        {/* Subject input */}
        <Combobox
          value={subject}
          onValueChange={setSubject}
          options={subjects}
          placeholder="Selecione a materia..."
          searchPlaceholder="Buscar..."
          emptyMessage="Nenhuma materia"
          disabled={isRunning || !canModify}
        />

        {/* Controls */}
        {!canModify ? (
          <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
            Selecione um workspace para usar o timer.
          </p>
        ) : (
          <div className="space-y-2">
            {!isRunning ? (
              <Button onClick={handleStart} className="w-full" size="lg">
                <Play className="h-4 w-4 mr-2" />
                {mode === 'pomodoro' && pomodoroPhase !== 'work'
                  ? 'Iniciar Pausa'
                  : 'Iniciar'}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Resetar
                </Button>
                <Button
                  onClick={handleStop}
                  variant="destructive"
                  className="flex-1"
                  size="lg"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Parar
                </Button>
              </div>
            )}

            {/* Skip break button */}
            {mode === 'pomodoro' && pomodoroPhase !== 'work' && !isRunning && (
              <Button
                onClick={handleSkipBreak}
                variant="ghost"
                className="w-full text-xs"
                size="sm"
              >
                Pular pausa e comecar novo pomodoro
              </Button>
            )}
          </div>
        )}

        {/* Pomodoro stats */}
        {mode === 'pomodoro' && totalWorkMinutes > 0 && (
          <div className="text-center text-xs text-muted-foreground border-t pt-2">
            Tempo de foco acumulado: {totalWorkMinutes} min
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default StudyTimer;
