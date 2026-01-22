import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { getApiClient } from '../api/client';
import { SessionsApi } from '../api/sessions';
import { CyclesApi, CycleSuggestion } from '../api/cycles';
import { Workspace } from '../api/workspaces';
import { formatDate, formatMinutes } from '../utils/format';

interface SessionLogProps {
  token: string;
  workspace: Workspace;
  suggestion: CycleSuggestion | null;
  onBack: () => void;
}

type Step = 'subject' | 'minutes' | 'confirm';

export function SessionLog({ token, workspace, suggestion, onBack }: SessionLogProps) {
  const [step, setStep] = useState<Step>('subject');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [selectedSubject, setSelectedSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [minutes, setMinutes] = useState('');

  const client = getApiClient(token);
  const sessionsApi = new SessionsApi(client);
  const cyclesApi = new CyclesApi(client);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const subs = await sessionsApi.getSubjects(workspace.id);

      // Add cycle subjects if available
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
    if (key.escape) {
      if (showCustomInput) {
        setShowCustomInput(false);
      } else if (step === 'minutes') {
        setStep('subject');
      } else if (step === 'confirm') {
        setStep('minutes');
      } else {
        onBack();
      }
    }
  });

  const handleSubjectSelect = (item: { label: string; value: string }) => {
    if (item.value === 'custom') {
      setShowCustomInput(true);
    } else {
      setSelectedSubject(item.value);
      setStep('minutes');
    }
  };

  const handleCustomSubjectSubmit = () => {
    if (customSubject.trim()) {
      setSelectedSubject(customSubject.trim());
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
      setStep('subject');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await sessionsApi.create({
        workspaceId: workspace.id,
        date: formatDate(new Date()),
        subject: selectedSubject,
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
        <Text> Loading subjects...</Text>
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
          {selectedSubject}: {formatMinutes(parseInt(minutes, 10))}
        </Text>
      </Box>
    );
  }

  // Build subject options
  const subjectItems = [
    // Suggested subject first if available
    ...(suggestion?.hasCycle && suggestion.suggestion
      ? [
          {
            label: `⭐ ${suggestion.suggestion.currentSubject} (suggested)`,
            value: suggestion.suggestion.currentSubject,
          },
        ]
      : []),
    // Other subjects
    ...subjects
      .filter((s) => s !== suggestion?.suggestion?.currentSubject)
      .map((s) => ({ label: s, value: s })),
    // Custom option
    { label: '+ Add new subject', value: 'custom' },
  ];

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Log Study Session
        </Text>
        <Text> - </Text>
        <Text color="yellow">{workspace.name}</Text>
      </Box>

      {error && (
        <Box marginBottom={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}

      {step === 'subject' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold>Select subject:</Text>
          </Box>
          {showCustomInput ? (
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

      {step === 'minutes' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text>Subject: <Text color="cyan">{selectedSubject}</Text></Text>
          </Box>
          <Box>
            <Text>Minutes studied: </Text>
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
            Subject: <Text color="cyan">{selectedSubject}</Text>
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
