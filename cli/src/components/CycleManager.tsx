import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { getApiClient } from '../api/client';
import { FocusCyclesApi, FocusCycle } from '../api/focusCycles';
import { Workspace } from '../api/workspaces';
import { formatMinutes } from '../utils/format';

interface CycleManagerProps {
  token: string;
  workspace: Workspace;
  onBack: () => void;
}

type Step = 'list' | 'create-name' | 'create-tasks' | 'create-minutes' | 'create-confirm';

interface CycleItem {
  task: string;
  targetMinutes: number;
}

export function CycleManager({ token, workspace, onBack }: CycleManagerProps) {
  const [step, setStep] = useState<Step>('list');
  const [cycles, setCycles] = useState<FocusCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create form state
  const [newCycleName, setNewCycleName] = useState('');
  const [newCycleItems, setNewCycleItems] = useState<CycleItem[]>([]);
  const [currentTask, setCurrentTask] = useState('');
  const [currentMinutes, setCurrentMinutes] = useState('');
  const [editingMinutesIndex, setEditingMinutesIndex] = useState(0);

  const client = getApiClient(token);
  const focusCyclesApi = new FocusCyclesApi(client);

  const loadCycles = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await focusCyclesApi.list(workspace.id);
      setCycles(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load focus cycles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCycles();
  }, []);

  useInput((input, key) => {
    if (key.escape) {
      if (step === 'create-name') {
        setStep('list');
        resetForm();
      } else if (step === 'create-tasks') {
        setStep('create-name');
      } else if (step === 'create-minutes') {
        setStep('create-tasks');
      } else if (step === 'create-confirm') {
        setStep('create-minutes');
      } else {
        onBack();
      }
    }
  });

  const resetForm = () => {
    setNewCycleName('');
    setNewCycleItems([]);
    setCurrentTask('');
    setCurrentMinutes('');
    setEditingMinutesIndex(0);
  };

  const handleCycleSelect = async (item: { label: string; value: string }) => {
    if (item.value === 'create') {
      setStep('create-name');
      return;
    }

    // Activate selected cycle
    const cycle = cycles.find((c) => c.id === item.value);
    if (cycle && !cycle.isActive) {
      setSaving(true);
      setError(null);
      try {
        await focusCyclesApi.activate(workspace.id, cycle.id);
        setSuccess(`Activated "${cycle.name}"`);
        await loadCycles();
        setTimeout(() => setSuccess(null), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to activate cycle');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleNameSubmit = () => {
    if (newCycleName.trim().length === 0) {
      setError('Cycle name cannot be empty');
      return;
    }
    if (newCycleName.trim().length > 50) {
      setError('Cycle name must be 50 characters or less');
      return;
    }
    setError(null);
    setStep('create-tasks');
  };

  const handleAddTask = () => {
    if (currentTask.trim().length === 0) {
      setError('Task name cannot be empty');
      return;
    }
    setError(null);
    setNewCycleItems([...newCycleItems, { task: currentTask.trim(), targetMinutes: 60 }]);
    setCurrentTask('');
  };

  const handleTaskAction = (item: { value: string }) => {
    if (item.value === 'done') {
      if (newCycleItems.length === 0) {
        setError('Add at least one task');
        return;
      }
      setError(null);
      setEditingMinutesIndex(0);
      setCurrentMinutes(newCycleItems[0].targetMinutes.toString());
      setStep('create-minutes');
    } else if (item.value.startsWith('remove-')) {
      const index = parseInt(item.value.replace('remove-', ''), 10);
      setNewCycleItems(newCycleItems.filter((_, i) => i !== index));
    }
  };

  const handleMinutesSubmit = () => {
    const mins = parseInt(currentMinutes, 10);
    if (isNaN(mins) || mins < 1 || mins > 1440) {
      setError('Minutes must be between 1 and 1440');
      return;
    }
    setError(null);

    const updated = [...newCycleItems];
    updated[editingMinutesIndex].targetMinutes = mins;
    setNewCycleItems(updated);

    if (editingMinutesIndex < newCycleItems.length - 1) {
      // Move to next task
      const nextIndex = editingMinutesIndex + 1;
      setEditingMinutesIndex(nextIndex);
      setCurrentMinutes(updated[nextIndex].targetMinutes.toString());
    } else {
      // All done, go to confirm
      setStep('create-confirm');
    }
  };

  const handleConfirm = async (item: { value: string }) => {
    if (item.value === 'no') {
      setStep('list');
      resetForm();
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await focusCyclesApi.create(workspace.id, {
        name: newCycleName.trim(),
        items: newCycleItems.map((item) => ({
          task: item.task,
          targetMinutes: item.targetMinutes,
        })),
        activateOnCreate: true,
      });
      setSuccess(`Created "${newCycleName.trim()}"`);
      resetForm();
      setStep('list');
      await loadCycles();
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create focus cycle');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box padding={1}>
        <Spinner type="dots" />
        <Text> Loading focus cycles...</Text>
      </Box>
    );
  }

  // Build cycle list items
  const cycleItems = [
    ...cycles.map((c) => ({
      label: c.isActive
        ? `> ${c.name} (active) - ${c.items.length} tasks`
        : `  ${c.name} - ${c.items.length} tasks`,
      value: c.id,
    })),
    { label: '+ Create New Focus Cycle', value: 'create' },
  ];

  // Build task action items for create flow
  const taskActionItems = [
    ...newCycleItems.map((item, i) => ({
      label: `x Remove "${item.task}"`,
      value: `remove-${i}`,
    })),
    { label: newCycleItems.length > 0 ? 'Done adding tasks' : '(Add tasks first)', value: 'done' },
  ];

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Focus Cycle Manager
        </Text>
        <Text> - </Text>
        <Text color="yellow">{workspace.name}</Text>
      </Box>

      {error && (
        <Box marginBottom={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}

      {success && (
        <Box marginBottom={1}>
          <Text color="green">{success}</Text>
        </Box>
      )}

      {saving && (
        <Box marginBottom={1}>
          <Spinner type="dots" />
          <Text> Processing...</Text>
        </Box>
      )}

      {step === 'list' && !saving && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold>Your Focus Cycles:</Text>
          </Box>
          {cycles.length === 0 ? (
            <Box marginBottom={1}>
              <Text color="gray">No focus cycles yet. Create your first one!</Text>
            </Box>
          ) : null}
          <SelectInput items={cycleItems} onSelect={handleCycleSelect} />
          <Box marginTop={1}>
            <Text color="gray">Select a cycle to activate it, or create a new one</Text>
          </Box>
        </Box>
      )}

      {step === 'create-name' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold>Step 1/4: Cycle Name</Text>
          </Box>
          <Box>
            <Text>Name: </Text>
            <TextInput value={newCycleName} onChange={setNewCycleName} onSubmit={handleNameSubmit} />
          </Box>
          <Box marginTop={1}>
            <Text color="gray">Enter a name for your focus cycle (max 50 characters)</Text>
          </Box>
        </Box>
      )}

      {step === 'create-tasks' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold>Step 2/4: Add Tasks</Text>
          </Box>
          <Box marginBottom={1}>
            <Text>
              Cycle: <Text color="cyan">{newCycleName}</Text>
            </Text>
          </Box>

          {newCycleItems.length > 0 && (
            <Box marginBottom={1} flexDirection="column">
              <Text color="gray">Added tasks:</Text>
              {newCycleItems.map((item, i) => (
                <Text key={i}>
                  {i + 1}. {item.task}
                </Text>
              ))}
            </Box>
          )}

          <Box marginBottom={1}>
            <Text>Add task: </Text>
            <TextInput value={currentTask} onChange={setCurrentTask} onSubmit={handleAddTask} />
          </Box>

          <Box marginBottom={1}>
            <Text color="gray">Press Enter to add, then select action below</Text>
          </Box>

          <SelectInput items={taskActionItems} onSelect={handleTaskAction} />
        </Box>
      )}

      {step === 'create-minutes' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold>Step 3/4: Set Target Minutes</Text>
          </Box>
          <Box marginBottom={1}>
            <Text>
              Cycle: <Text color="cyan">{newCycleName}</Text>
            </Text>
          </Box>

          <Box marginBottom={1} flexDirection="column">
            {newCycleItems.map((item, i) => (
              <Text key={i} color={i === editingMinutesIndex ? 'yellow' : i < editingMinutesIndex ? 'green' : 'gray'}>
                {i < editingMinutesIndex ? '>' : i === editingMinutesIndex ? '>' : ' '} {item.task}:{' '}
                {i < editingMinutesIndex ? formatMinutes(item.targetMinutes) : i === editingMinutesIndex ? '...' : '?'}
              </Text>
            ))}
          </Box>

          <Box>
            <Text>
              Minutes for <Text color="cyan">{newCycleItems[editingMinutesIndex].task}</Text>:{' '}
            </Text>
            <TextInput value={currentMinutes} onChange={setCurrentMinutes} onSubmit={handleMinutesSubmit} />
          </Box>
          <Box marginTop={1}>
            <Text color="gray">
              Task {editingMinutesIndex + 1} of {newCycleItems.length}
            </Text>
          </Box>
        </Box>
      )}

      {step === 'create-confirm' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold>Step 4/4: Confirm</Text>
          </Box>

          <Box marginBottom={1} flexDirection="column" borderStyle="round" paddingX={1}>
            <Text bold color="cyan">
              {newCycleName}
            </Text>
            {newCycleItems.map((item, i) => (
              <Text key={i}>
                {i + 1}. {item.task} - <Text color="green">{formatMinutes(item.targetMinutes)}</Text>
              </Text>
            ))}
            <Box marginTop={1}>
              <Text color="gray">
                Total: {formatMinutes(newCycleItems.reduce((acc, item) => acc + item.targetMinutes, 0))}
              </Text>
            </Box>
          </Box>

          {saving ? (
            <Box>
              <Spinner type="dots" />
              <Text> Creating focus cycle...</Text>
            </Box>
          ) : (
            <Box flexDirection="column">
              <Box marginBottom={1}>
                <Text>Create this focus cycle and activate it?</Text>
              </Box>
              <SelectInput
                items={[
                  { label: 'Yes, create and activate', value: 'yes' },
                  { label: 'No, cancel', value: 'no' },
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
