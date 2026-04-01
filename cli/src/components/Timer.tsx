import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { getApiClient } from '../api/client';
import { SessionsApi } from '../api/sessions';
import { CycleSuggestion } from '../api/focusCycles';
import { Workspace } from '../api/workspaces';
import { formatDate, formatMinutes, progressBar } from '../utils/format';
import { useTimer } from '../context/TimerContext';

interface TimerProps {
  token: string;
  workspace: Workspace;
  suggestion: CycleSuggestion | null;
  onBack: () => void;
}

type Step = 'select-task' | 'select-time' | 'custom-time' | 'running' | 'completed' | 'save-confirm';

const TIME_PRESETS = [
  { label: '25 min (Pomodoro)', value: 25 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
  { label: 'Custom', value: -1 },
];

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function Timer({ token, workspace, suggestion, onBack }: TimerProps) {
  const timer = useTimer();
  const { state: timerState } = timer;

  // Determine initial step based on timer state
  const getInitialStep = (): Step => {
    if (timerState.isRunning && timerState.workspaceId === workspace.id) {
      return 'running';
    }
    if (timerState.remainingSeconds === 0 && timerState.totalSeconds > 0 && timerState.workspaceId === workspace.id) {
      return 'completed';
    }
    return 'select-task';
  };

  const [step, setStep] = useState<Step>(getInitialStep);
  const [tasks, setTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedTask, setSelectedTask] = useState(timerState.task || '');
  const [customTask, setCustomTask] = useState('');
  const [showCustomTaskInput, setShowCustomTaskInput] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');

  const client = getApiClient(token);
  const sessionsApi = new SessionsApi(client);

  useEffect(() => {
    loadTasks();
  }, []);

  // Sync step with timer state changes
  useEffect(() => {
    if (timerState.isRunning && timerState.workspaceId === workspace.id) {
      setStep('running');
      setSelectedTask(timerState.task);
    } else if (timerState.remainingSeconds === 0 && timerState.totalSeconds > 0 && timerState.workspaceId === workspace.id) {
      setStep('completed');
    }
  }, [timerState.isRunning, timerState.remainingSeconds, timerState.workspaceId, workspace.id]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const taskList = await sessionsApi.getTasks(workspace.id);
      if (suggestion?.hasCycle && suggestion.suggestion) {
        const cycleTasks = suggestion.suggestion.allItemsProgress.map((p) => p.task);
        const allTasks = [...new Set([...cycleTasks, ...taskList])];
        setTasks(allTasks);
      } else {
        setTasks(taskList);
      }
    } catch {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useInput((input, key) => {
    if (step === 'running') {
      if (input === ' ') {
        timer.toggle();
      } else if (input.toLowerCase() === 'q') {
        // Calculate elapsed time for saving
        const elapsedSeconds = timerState.totalSeconds - timerState.remainingSeconds;
        timer.stop();
        if (elapsedSeconds >= 60) {
          setStep('save-confirm');
        } else {
          onBack();
        }
      } else if (input.toLowerCase() === 'r') {
        timer.reset();
      }
      return;
    }

    if (key.escape) {
      if (showCustomTaskInput) {
        setShowCustomTaskInput(false);
      } else if (step === 'select-time') {
        setStep('select-task');
      } else if (step === 'custom-time') {
        setStep('select-time');
      } else if (step === 'completed' || step === 'save-confirm') {
        onBack();
      } else {
        onBack();
      }
    }
  });

  const handleTaskSelect = (item: { label: string; value: string }) => {
    if (item.value === 'custom') {
      setShowCustomTaskInput(true);
    } else {
      setSelectedTask(item.value);
      setStep('select-time');
    }
  };

  const handleCustomTaskSubmit = () => {
    if (customTask.trim()) {
      setSelectedTask(customTask.trim());
      setShowCustomTaskInput(false);
      setStep('select-time');
    }
  };

  const handleTimeSelect = (item: { label: string; value: number | string }) => {
    if (item.value === -1) {
      setStep('custom-time');
    } else if (item.value === 'suggestion' && suggestion?.suggestion) {
      const mins = Math.max(1, suggestion.suggestion.remainingMinutes);
      startTimer(mins);
    } else {
      startTimer(item.value as number);
    }
  };

  const handleCustomTimeSubmit = () => {
    const mins = parseInt(customMinutes, 10);
    if (isNaN(mins) || mins < 1 || mins > 1440) {
      setError('Minutes must be between 1 and 1440');
      return;
    }
    setError(null);
    startTimer(mins);
  };

  const startTimer = (minutes: number) => {
    timer.start(selectedTask, minutes, workspace.id);
    setStep('running');
  };

  const handleSaveSession = async (save: boolean) => {
    if (!save) {
      onBack();
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const elapsedMinutes = Math.round((timerState.totalSeconds - timerState.remainingSeconds) / 60);
      await sessionsApi.create({
        workspaceId: workspace.id,
        date: formatDate(new Date()),
        task: selectedTask,
        minutes: elapsedMinutes,
      });
      onBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save session');
      setSaving(false);
    }
  };

  const handleCompletedAction = async (item: { value: string }) => {
    if (item.value === 'save') {
      setSaving(true);
      setError(null);
      try {
        const minutes = Math.round(timerState.totalSeconds / 60);
        await sessionsApi.create({
          workspaceId: workspace.id,
          date: formatDate(new Date()),
          task: selectedTask,
          minutes,
        });
        onBack();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save session');
        setSaving(false);
      }
    } else if (item.value === 'restart') {
      timer.reset();
      timer.start(selectedTask, Math.round(timerState.totalSeconds / 60), workspace.id);
      setStep('running');
    } else {
      onBack();
    }
  };

  if (loading) {
    return (
      <Box padding={1}>
        <Spinner type="dots" />
        <Text> Loading...</Text>
      </Box>
    );
  }

  // Build task options
  const taskItems = [
    ...(suggestion?.hasCycle && suggestion.suggestion
      ? [
          {
            label: `* ${suggestion.suggestion.currentTask} (suggested - ${formatMinutes(suggestion.suggestion.remainingMinutes)} remaining)`,
            value: suggestion.suggestion.currentTask,
          },
        ]
      : []),
    ...tasks
      .filter((t) => t !== suggestion?.suggestion?.currentTask)
      .map((t) => ({ label: t, value: t })),
    { label: '+ Add new task', value: 'custom' },
  ];

  // Build time presets with suggestion
  const timeItems = [
    ...(suggestion?.hasCycle && suggestion.suggestion && suggestion.suggestion.remainingMinutes > 0
      ? [
          {
            label: `* ${formatMinutes(suggestion.suggestion.remainingMinutes)} (cycle suggestion)`,
            value: 'suggestion',
          },
        ]
      : []),
    ...TIME_PRESETS.map((p) => ({ label: p.label, value: p.value })),
  ];

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Work Timer
        </Text>
        <Text> - </Text>
        <Text color="yellow">{workspace.name}</Text>
      </Box>

      {error && (
        <Box marginBottom={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}

      {step === 'select-task' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold>Select task to work on:</Text>
          </Box>
          {showCustomTaskInput ? (
            <Box>
              <Text>Task name: </Text>
              <TextInput
                value={customTask}
                onChange={setCustomTask}
                onSubmit={handleCustomTaskSubmit}
              />
            </Box>
          ) : (
            <SelectInput items={taskItems} onSelect={handleTaskSelect} />
          )}
        </Box>
      )}

      {step === 'select-time' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text>
              Task: <Text color="cyan">{selectedTask}</Text>
            </Text>
          </Box>
          <Box marginBottom={1}>
            <Text bold>Select timer duration:</Text>
          </Box>
          <SelectInput items={timeItems} onSelect={handleTimeSelect} />
        </Box>
      )}

      {step === 'custom-time' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text>
              Task: <Text color="cyan">{selectedTask}</Text>
            </Text>
          </Box>
          <Box>
            <Text>Minutes: </Text>
            <TextInput value={customMinutes} onChange={setCustomMinutes} onSubmit={handleCustomTimeSubmit} />
          </Box>
          <Box marginTop={1}>
            <Text color="gray">Enter a number between 1 and 1440</Text>
          </Box>
        </Box>
      )}

      {step === 'running' && (
        <Box flexDirection="column">
          <Box marginBottom={1} flexDirection="column" borderStyle="round" paddingX={2} paddingY={1}>
            <Box justifyContent="center" marginBottom={1}>
              <Text color="cyan" bold>
                {timerState.task}
              </Text>
            </Box>

            <Box justifyContent="center" marginBottom={1}>
              <Text bold color={timerState.isPaused ? 'yellow' : timerState.remainingSeconds <= 60 ? 'red' : 'green'}>
                {formatTime(timerState.remainingSeconds)}
              </Text>
            </Box>

            <Box justifyContent="center" marginBottom={1}>
              <Text>{progressBar(timerState.totalSeconds - timerState.remainingSeconds, timerState.totalSeconds, 30)}</Text>
            </Box>

            {timerState.isPaused && (
              <Box justifyContent="center">
                <Text color="yellow">PAUSED</Text>
              </Box>
            )}
          </Box>

          <Box>
            <Text color="gray">
              [Space] {timerState.isPaused ? 'Resume' : 'Pause'}  [Q] Quit  [R] Reset
            </Text>
          </Box>
        </Box>
      )}

      {step === 'completed' && (
        <Box flexDirection="column">
          <Box marginBottom={1} flexDirection="column" borderStyle="round" paddingX={2} paddingY={1}>
            <Box justifyContent="center" marginBottom={1}>
              <Text color="green" bold>
                Timer Complete!
              </Text>
            </Box>
            <Text>
              Task: <Text color="cyan">{selectedTask}</Text>
            </Text>
            <Text>
              Duration: <Text color="green">{formatMinutes(Math.round(timerState.totalSeconds / 60))}</Text>
            </Text>
          </Box>

          {saving ? (
            <Box>
              <Spinner type="dots" />
              <Text> Saving session...</Text>
            </Box>
          ) : (
            <Box flexDirection="column">
              <Box marginBottom={1}>
                <Text bold>What would you like to do?</Text>
              </Box>
              <SelectInput
                items={[
                  { label: 'Save session', value: 'save' },
                  { label: 'Restart timer', value: 'restart' },
                  { label: 'Exit without saving', value: 'exit' },
                ]}
                onSelect={handleCompletedAction}
              />
            </Box>
          )}
        </Box>
      )}

      {step === 'save-confirm' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text>Timer stopped early. Save partial session?</Text>
          </Box>
          <Text>
            Task: <Text color="cyan">{selectedTask}</Text>
          </Text>
          <Text>
            Duration: <Text color="yellow">{formatMinutes(Math.round((timerState.totalSeconds - timerState.remainingSeconds) / 60))}</Text>
          </Text>

          {saving ? (
            <Box marginTop={1}>
              <Spinner type="dots" />
              <Text> Saving...</Text>
            </Box>
          ) : (
            <Box marginTop={1}>
              <SelectInput
                items={[
                  { label: 'Yes, save partial session', value: 'yes' },
                  { label: 'No, discard', value: 'no' },
                ]}
                onSelect={(item) => handleSaveSession(item.value === 'yes')}
              />
            </Box>
          )}
        </Box>
      )}

      {step !== 'running' && step !== 'completed' && step !== 'save-confirm' && (
        <Box marginTop={1}>
          <Text color="gray">Press ESC to go back</Text>
        </Box>
      )}
    </Box>
  );
}
