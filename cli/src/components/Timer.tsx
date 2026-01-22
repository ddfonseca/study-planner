import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { getApiClient } from '../api/client';
import { SessionsApi } from '../api/sessions';
import { CycleSuggestion } from '../api/cycles';
import { Workspace } from '../api/workspaces';
import { formatDate, formatMinutes, progressBar } from '../utils/format';
import { useTimer } from '../context/TimerContext';

interface TimerProps {
  token: string;
  workspace: Workspace;
  suggestion: CycleSuggestion | null;
  onBack: () => void;
}

type Step = 'select-subject' | 'select-time' | 'custom-time' | 'running' | 'completed' | 'save-confirm';

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
    return 'select-subject';
  };

  const [step, setStep] = useState<Step>(getInitialStep);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedSubject, setSelectedSubject] = useState(timerState.subject || '');
  const [customSubject, setCustomSubject] = useState('');
  const [showCustomSubjectInput, setShowCustomSubjectInput] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');

  const client = getApiClient(token);
  const sessionsApi = new SessionsApi(client);

  useEffect(() => {
    loadSubjects();
  }, []);

  // Sync step with timer state changes
  useEffect(() => {
    if (timerState.isRunning && timerState.workspaceId === workspace.id) {
      setStep('running');
      setSelectedSubject(timerState.subject);
    } else if (timerState.remainingSeconds === 0 && timerState.totalSeconds > 0 && timerState.workspaceId === workspace.id) {
      setStep('completed');
    }
  }, [timerState.isRunning, timerState.remainingSeconds, timerState.workspaceId, workspace.id]);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const subs = await sessionsApi.getSubjects(workspace.id);
      if (suggestion?.hasCycle && suggestion.suggestion) {
        const cycleSubjects = suggestion.suggestion.allItemsProgress.map((p) => p.subject);
        const allSubjects = [...new Set([...cycleSubjects, ...subs])];
        setSubjects(allSubjects);
      } else {
        setSubjects(subs);
      }
    } catch {
      setError('Failed to load subjects');
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
      if (showCustomSubjectInput) {
        setShowCustomSubjectInput(false);
      } else if (step === 'select-time') {
        setStep('select-subject');
      } else if (step === 'custom-time') {
        setStep('select-time');
      } else if (step === 'completed' || step === 'save-confirm') {
        onBack();
      } else {
        onBack();
      }
    }
  });

  const handleSubjectSelect = (item: { label: string; value: string }) => {
    if (item.value === 'custom') {
      setShowCustomSubjectInput(true);
    } else {
      setSelectedSubject(item.value);
      setStep('select-time');
    }
  };

  const handleCustomSubjectSubmit = () => {
    if (customSubject.trim()) {
      setSelectedSubject(customSubject.trim());
      setShowCustomSubjectInput(false);
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
    timer.start(selectedSubject, minutes, workspace.id);
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
        subject: selectedSubject,
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
          subject: selectedSubject,
          minutes,
        });
        onBack();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save session');
        setSaving(false);
      }
    } else if (item.value === 'restart') {
      timer.reset();
      timer.start(selectedSubject, Math.round(timerState.totalSeconds / 60), workspace.id);
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

  // Build subject options
  const subjectItems = [
    ...(suggestion?.hasCycle && suggestion.suggestion
      ? [
          {
            label: `* ${suggestion.suggestion.currentSubject} (suggested - ${formatMinutes(suggestion.suggestion.remainingMinutes)} remaining)`,
            value: suggestion.suggestion.currentSubject,
          },
        ]
      : []),
    ...subjects
      .filter((s) => s !== suggestion?.suggestion?.currentSubject)
      .map((s) => ({ label: s, value: s })),
    { label: '+ Add new subject', value: 'custom' },
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
          Study Timer
        </Text>
        <Text> - </Text>
        <Text color="yellow">{workspace.name}</Text>
      </Box>

      {error && (
        <Box marginBottom={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}

      {step === 'select-subject' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold>Select subject to study:</Text>
          </Box>
          {showCustomSubjectInput ? (
            <Box>
              <Text>Subject name: </Text>
              <TextInput
                value={customSubject}
                onChange={setCustomSubject}
                onSubmit={handleCustomSubjectSubmit}
              />
            </Box>
          ) : (
            <SelectInput items={subjectItems} onSelect={handleSubjectSelect} />
          )}
        </Box>
      )}

      {step === 'select-time' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text>
              Subject: <Text color="cyan">{selectedSubject}</Text>
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
              Subject: <Text color="cyan">{selectedSubject}</Text>
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
                {timerState.subject}
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
              Subject: <Text color="cyan">{selectedSubject}</Text>
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
            Subject: <Text color="cyan">{selectedSubject}</Text>
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
