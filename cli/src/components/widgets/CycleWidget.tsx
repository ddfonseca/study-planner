import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { getApiClient } from '../../api/client';
import { CyclesApi, CycleSuggestion } from '../../api/cycles';
import { truncate } from '../../utils/format';

interface CycleWidgetProps {
  token: string;
  workspaceId: string;
}

export function CycleWidget({ token, workspaceId }: CycleWidgetProps) {
  const [suggestion, setSuggestion] = useState<CycleSuggestion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCycle = async () => {
      try {
        const client = getApiClient(token);
        const cyclesApi = new CyclesApi(client);
        const sug = await cyclesApi.getSuggestion(workspaceId);
        setSuggestion(sug);
      } catch {
        // Silently fail - widget is informational
      } finally {
        setLoading(false);
      }
    };

    loadCycle();
    // Refresh every 30 seconds
    const interval = setInterval(loadCycle, 30000);
    return () => clearInterval(interval);
  }, [token, workspaceId]);

  if (loading) {
    return (
      <Box flexDirection="column" borderStyle="round" paddingX={1}>
        <Text bold color="blue">CICLO DE ESTUDO</Text>
        <Text color="gray">Loading...</Text>
      </Box>
    );
  }

  if (!suggestion?.hasCycle || !suggestion.suggestion) {
    return (
      <Box flexDirection="column" borderStyle="round" paddingX={1}>
        <Text bold color="gray">CICLO DE ESTUDO</Text>
        <Text color="gray">No cycle active</Text>
        <Text color="gray" dimColor>Use menu to create</Text>
      </Box>
    );
  }

  const { suggestion: sug } = suggestion;
  const items = sug.allItemsProgress.slice(0, 5); // Show max 5 items

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>
      <Box justifyContent="space-between">
        <Text bold color="blue">CICLO DE ESTUDO</Text>
        {sug.isCurrentComplete && (
          <Text color="green">PRONTO</Text>
        )}
      </Box>
      {items.map((item) => {
        const isCurrent = item.position === sug.currentPosition;
        const mins = `${item.accumulatedMinutes}/${item.targetMinutes}m`;
        const maxSubjectLen = 12;
        const subjectDisplay = truncate(item.subject, maxSubjectLen);

        return (
          <Box key={item.subject}>
            <Text color={isCurrent ? 'cyan' : item.isComplete ? 'green' : 'white'}>
              {isCurrent ? '> ' : '  '}
              {subjectDisplay.padEnd(maxSubjectLen)}
            </Text>
            <Text color={item.isComplete ? 'green' : 'gray'}> {mins}</Text>
          </Box>
        );
      })}
      {sug.allItemsProgress.length > 5 && (
        <Text color="gray">  +{sug.allItemsProgress.length - 5} more</Text>
      )}
      {sug.isCurrentComplete && (
        <Text color="green" dimColor>Go to Cycle to advance</Text>
      )}
    </Box>
  );
}
