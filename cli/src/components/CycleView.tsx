import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import { getApiClient } from '../api/client';
import { CyclesApi, CycleSuggestion, CycleStatistics } from '../api/cycles';
import { Workspace } from '../api/workspaces';
import { formatMinutes, progressBar } from '../utils/format';

interface CycleViewProps {
  token: string;
  workspace: Workspace;
  onBack: () => void;
}

export function CycleView({ token, workspace, onBack }: CycleViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<CycleSuggestion | null>(null);
  const [statistics, setStatistics] = useState<CycleStatistics | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [advanceSuccess, setAdvanceSuccess] = useState<string | null>(null);

  const client = getApiClient(token);
  const cyclesApi = new CyclesApi(client);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [sug, stats] = await Promise.all([
        cyclesApi.getSuggestion(workspace.id),
        cyclesApi.getStatistics(workspace.id),
      ]);
      setSuggestion(sug);
      setStatistics(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cycle');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useInput((input, key) => {
    if (key.escape) {
      onBack();
    }
  });

  const handleAdvance = async () => {
    setAdvancing(true);
    setError(null);

    try {
      const result = await cyclesApi.advance(workspace.id);
      setAdvanceSuccess(
        result.cycleCompleted
          ? `Cycle completed! Starting over with ${result.newSubject}`
          : `Advanced to ${result.newSubject}`
      );
      await loadData();
      setTimeout(() => setAdvanceSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to advance cycle');
    } finally {
      setAdvancing(false);
    }
  };

  const handleAction = (item: { value: string }) => {
    if (item.value === 'advance') {
      handleAdvance();
    } else if (item.value === 'back') {
      onBack();
    }
  };

  if (loading) {
    return (
      <Box padding={1}>
        <Spinner type="dots" />
        <Text> Loading cycle...</Text>
      </Box>
    );
  }

  if (!suggestion?.hasCycle) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="cyan">
          Study Cycle
        </Text>
        <Box marginY={1}>
          <Text color="yellow">No active study cycle found.</Text>
        </Box>
        <Text color="gray">Create a cycle in the web app to get started.</Text>
        <Box marginTop={1}>
          <Text color="gray">Press ESC to go back</Text>
        </Box>
      </Box>
    );
  }

  const sug = suggestion.suggestion!;
  const items = sug.allItemsProgress;

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Study Cycle
        </Text>
        <Text> - </Text>
        <Text color="yellow">{workspace.name}</Text>
      </Box>

      {error && (
        <Box marginBottom={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}

      {advanceSuccess && (
        <Box marginBottom={1}>
          <Text color="green">{advanceSuccess}</Text>
        </Box>
      )}

      {/* Overall Progress */}
      {statistics && (
        <Box marginBottom={1} flexDirection="column" borderStyle="round" paddingX={1}>
          <Text bold color="blue">
            Overall Progress
          </Text>
          <Text>
            {formatMinutes(statistics.totalAccumulatedMinutes)} /{' '}
            {formatMinutes(statistics.totalTargetMinutes)}
          </Text>
          <Text>{progressBar(statistics.totalAccumulatedMinutes, statistics.totalTargetMinutes, 30)}</Text>
          <Text color="gray">
            {statistics.completedItemsCount}/{statistics.totalItemsCount} subjects completed
          </Text>
        </Box>
      )}

      {/* Current Subject */}
      <Box marginBottom={1} flexDirection="column" borderStyle="round" paddingX={1}>
        <Text bold color="green">
          Current Subject
        </Text>
        <Text>
          <Text color="cyan" bold>
            {sug.currentSubject}
          </Text>
        </Text>
        <Text>
          {formatMinutes(sug.currentAccumulatedMinutes)} / {formatMinutes(sug.currentTargetMinutes)}
        </Text>
        <Text>{progressBar(sug.currentAccumulatedMinutes, sug.currentTargetMinutes, 25)}</Text>
        {sug.isCurrentComplete && <Text color="green">Target reached! Ready to advance.</Text>}
        {!sug.isCurrentComplete && (
          <Text color="gray">{formatMinutes(sug.remainingMinutes)} remaining</Text>
        )}
      </Box>

      {/* All Subjects */}
      <Box marginBottom={1} flexDirection="column" borderStyle="round" paddingX={1}>
        <Text bold>All Subjects</Text>
        {items.map((item, index) => (
          <Box key={item.subject}>
            <Text color={item.position === sug.currentPosition ? 'cyan' : 'white'}>
              {item.position === sug.currentPosition ? '▶ ' : '  '}
              {item.subject}
            </Text>
            <Text> </Text>
            <Text color={item.isComplete ? 'green' : 'gray'}>
              {formatMinutes(item.accumulatedMinutes)}/{formatMinutes(item.targetMinutes)}
              {item.isComplete ? ' ✓' : ''}
            </Text>
          </Box>
        ))}
      </Box>

      {/* Next Subject */}
      {sug.nextSubject && sug.nextSubject !== sug.currentSubject && (
        <Box marginBottom={1}>
          <Text>
            Next up: <Text color="yellow">{sug.nextSubject}</Text>
          </Text>
        </Box>
      )}

      {/* Actions */}
      {advancing ? (
        <Box>
          <Spinner type="dots" />
          <Text> Advancing...</Text>
        </Box>
      ) : (
        <Box flexDirection="column">
          <Text bold>Actions:</Text>
          <SelectInput
            items={[
              ...(sug.isCurrentComplete
                ? [{ label: '⏩ Advance to next subject', value: 'advance' }]
                : []),
              { label: '← Back to menu', value: 'back' },
            ]}
            onSelect={handleAction}
          />
        </Box>
      )}

      <Box marginTop={1}>
        <Text color="gray">Press ESC to go back</Text>
      </Box>
    </Box>
  );
}
