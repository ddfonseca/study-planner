import React from 'react';
import { Box } from 'ink';
import { TimerWidget } from './widgets/TimerWidget';
import { CycleWidget } from './widgets/CycleWidget';
import { CalendarWidget } from './widgets/CalendarWidget';

interface SidePanelProps {
  token: string;
  workspaceId: string;
  width: number;
}

export function SidePanel({ token, workspaceId, width }: SidePanelProps) {
  return (
    <Box flexDirection="column" width={width}>
      <TimerWidget />
      <Box marginTop={1}>
        <CycleWidget token={token} workspaceId={workspaceId} />
      </Box>
      <Box marginTop={1}>
        <CalendarWidget token={token} workspaceId={workspaceId} />
      </Box>
    </Box>
  );
}
