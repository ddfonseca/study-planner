import React, { useState, useEffect } from 'react';
import { Box, useStdout } from 'ink';
import { SidePanel } from './SidePanel';

interface LayoutProps {
  children: React.ReactNode;
  token: string;
  workspaceId: string | null;
}

const MIN_WIDTH_FOR_PANEL = 100;
const SIDE_PANEL_WIDTH = 30;

export function Layout({ children, token, workspaceId }: LayoutProps) {
  const { stdout } = useStdout();
  const [terminalWidth, setTerminalWidth] = useState(stdout?.columns || 80);

  useEffect(() => {
    const handleResize = () => {
      if (stdout?.columns) {
        setTerminalWidth(stdout.columns);
      }
    };

    stdout?.on('resize', handleResize);
    handleResize();

    return () => {
      stdout?.off('resize', handleResize);
    };
  }, [stdout]);

  const showSidePanel = terminalWidth >= MIN_WIDTH_FOR_PANEL && workspaceId;

  if (!showSidePanel) {
    return <Box flexDirection="column">{children}</Box>;
  }

  return (
    <Box flexDirection="row" width="100%">
      <Box flexDirection="column" flexGrow={1} marginRight={1}>
        {children}
      </Box>
      <SidePanel token={token} workspaceId={workspaceId} width={SIDE_PANEL_WIDTH} />
    </Box>
  );
}
