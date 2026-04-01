import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { getApiClient } from '../api/client';
import { SessionsApi } from '../api/sessions';
import { FocusCyclesApi, CycleSuggestion } from '../api/focusCycles';
import { Workspace } from '../api/workspaces';
import { formatDate, formatMinutes } from '../utils/format';

interface SessionLogProps {
  token: string;
  workspace: Workspace;
  suggestion: CycleSuggestion | null;
  onBack: () => void;
}

type Step = 'task' | 'minutes' | 'confirm';

export function SessionLog({ token, workspace, suggestion, onBack }: SessionLogProps) {
  const [step, setStep] = useState<Step>('task');
  const [tasks, setTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [selectedTask, setSelectedTask] = useState('');
  const [customTask, setCustomTask] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [minutes, setMinutes] = useState('');

  const client = getApiClient(token);
  const sessionsApi = new SessionsApi(client);
  const focusCyclesApi = new FocusCyclesApi(client);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const taskList = await sessionsApi.getTasks(workspace.id);

      // Add cycle tasks if available
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
    if (key.escape) {
      if (showCustomInput) {
        setShowCustomInput(false);
      } else if (step === 'minutes') {
        setStep('task');
      } else if (step === 'confirm') {
        setStep('minutes');
      } else {
        onBack();
      }
    }
  });

  const handleTaskSelect = (item: { label: string; value: string }) => {
    if (item.value === 'custom') {
      setShowCustomInput(true);
    } else {
      setSelectedTask(item.value);
      setStep('minutes');
    }
  };

  const handleCustomTaskSubmit = () => {
    if (customTask.trim()) {
      setSelectedTask(customTask.trim());
      setShowCustomInput(false);
      setStep('minutes');
    }
  };

  const handleMinutesSubmit = () => {
    const mins = parseInt(minutes, 10);
    if (isNaN(mins) || mins < 1 || mins > 1440) {
      setError('Minutes must be between 1 and 1440');
      return;
    }
    setError(null);
    setStep('confirm');
  };

  const handleConfirm = async (item: { value: string }) => {
    if (item.value === 'no') {
      setStep('task');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await sessionsApi.create({
        workspaceId: workspace.id,
        date: formatDate(new Date()),
        task: selectedTask,
        minutes: parseInt(minutes, 10),
      });
      setSuccess(true);
      setTimeout(onBack, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save session');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box padding={1}>
        <Spinner type="dots" />
        <Text> Loading tasks...</Text>
      </Box>
    );
  }

  if (success) {
    return (
      <Box padding={1} flexDirection="column">
        <Text color="green" bold>
          Session logged successfully!
        </Text>
        <Text>
          {selectedTask}: {formatMinutes(parseInt(minutes, 10))}
        </Text>
      </Box>
    );
  }

  // Build task options
  const taskItems = [
    // Suggested task first if available
    ...(suggestion?.hasCycle && suggestion.suggestion
      ? [
          {
            label: `* ${suggestion.suggestion.currentTask} (suggested)`,
            value: suggestion.suggestion.currentTask,
          },
        ]
      : []),
    // Other tasks
    ...tasks
      .filter((t) => t !== suggestion?.suggestion?.currentTask)
      .map((t) => ({ label: t, value: t })),
    // Custom option
    { label: '+ Add new task', value: 'custom' },
  ];

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Log Work Session
        </Text>
        <Text> - </Text>
        <Text color="yellow">{workspace.name}</Text>
      </Box>

      {error && (
        <Box marginBottom={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}

      {step === 'task' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold>Select task:</Text>
          </Box>
          {showCustomInput ? (
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

      {step === 'minutes' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text>Task: <Text color="cyan">{selectedTask}</Text></Text>
          </Box>
          <Box>
            <Text>Minutes worked: </Text>
            <TextInput value={minutes} onChange={setMinutes} onSubmit={handleMinutesSubmit} />
          </Box>
          <Box marginTop={1}>
            <Text color="gray">Enter a number between 1 and 1440</Text>
          </Box>
        </Box>
      )}

      {step === 'confirm' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold>Confirm session:</Text>
          </Box>
          <Text>
            Task: <Text color="cyan">{selectedTask}</Text>
          </Text>
          <Text>
            Duration: <Text color="green">{formatMinutes(parseInt(minutes, 10))}</Text>
          </Text>
          <Text>
            Date: <Text>{formatDate(new Date())}</Text>
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
                  { label: 'Yes, save', value: 'yes' },
                  { label: 'No, go back', value: 'no' },
                ]}
                onSelect={handleConfirm}
              />
            </Box>
          )}
        </Box>
      )}

      <Box marginTop={1}>
        <Text color="gray">Press ESC to go back</Text>
      </Box>
    </Box>
  );
}
