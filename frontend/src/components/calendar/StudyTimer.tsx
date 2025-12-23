/**
 * Study Timer - Simple stopwatch for tracking study sessions
 */
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { useSessions } from '@/hooks/useSessions';
import { useToast } from '@/hooks/use-toast';
import { Play, Square, Clock } from 'lucide-react';

const STORAGE_KEY = 'studyTimer';

interface TimerState {
  isRunning: boolean;
  seconds: number;
  subject: string;
  startTime: number | null;
}

interface StudyTimerProps {
  subjects: string[];
}

export function StudyTimer({ subjects }: StudyTimerProps) {
  const { handleAddSession, canModify } = useSessions();
  const { toast } = useToast();

  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [subject, setSubject] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initializedRef = useRef(false);

  // Load saved state from localStorage on mount
  /* eslint-disable react-hooks/set-state-in-effect -- Initialization from localStorage on mount is intentional */
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const state: TimerState = JSON.parse(saved);
        if (state.isRunning && state.startTime) {
          const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
          setSeconds(elapsed);
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
  /* eslint-enable react-hooks/set-state-in-effect */

  // Save state to localStorage
  useEffect(() => {
    const state: TimerState = {
      isRunning,
      seconds,
      subject,
      startTime: isRunning ? Date.now() - seconds * 1000 : null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [isRunning, seconds, subject]);

  // Timer interval
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
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

  // Update page title when timer is running
  useEffect(() => {
    if (isRunning) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      document.title = `${timeStr} - ${subject}`;
    } else {
      document.title = 'Study Planner';
    }
    return () => {
      document.title = 'Study Planner';
    };
  }, [isRunning, seconds, subject]);

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!subject.trim()) {
      toast({
        title: 'Atenção',
        description: 'Digite a matéria antes de iniciar',
        variant: 'destructive',
      });
      return;
    }
    setIsRunning(true);
  };

  const handleStop = async () => {
    setIsRunning(false);

    const minutes = Math.floor(seconds / 60);

    if (minutes > 0) {
      try {
        const today = new Date().toISOString().split('T')[0];
        await handleAddSession(today, subject.trim(), minutes);
        toast({
          title: 'Sessão salva!',
          description: `${minutes} minutos de ${subject} registrados`,
        });
      } catch (err) {
        toast({
          title: 'Erro',
          description: err instanceof Error ? err.message : 'Falha ao salvar sessão',
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
    setSeconds(0);
    setSubject('');
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Estudar Agora
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timer display */}
        <div className="text-center">
          <span
            className={`text-3xl font-mono font-bold ${
              isRunning ? 'text-primary' : 'text-muted-foreground'
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
          placeholder="Selecione a matéria..."
          searchPlaceholder="Buscar..."
          emptyMessage="Nenhuma matéria"
          disabled={isRunning || !canModify}
        />

        {/* Start/Stop button */}
        {!canModify ? (
          <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
            Selecione um workspace para usar o timer.
          </p>
        ) : !isRunning ? (
          <Button onClick={handleStart} className="w-full" size="lg">
            <Play className="h-4 w-4 mr-2" />
            Iniciar
          </Button>
        ) : (
          <Button
            onClick={handleStop}
            variant="destructive"
            className="w-full"
            size="lg"
          >
            <Square className="h-4 w-4 mr-2" />
            Parar e Salvar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default StudyTimer;
