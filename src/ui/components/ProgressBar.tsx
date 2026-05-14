import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../shared/theme.js';
import type { OperationProgress } from '../../types/index.js';

type ProgressBarProps = {
  progress: OperationProgress;
  width: number;
};

export const ProgressBar = ({ progress, width }: ProgressBarProps) => {
  const ratio =
    progress.total <= 0 ? 0 : Math.max(0, Math.min(progress.current / progress.total, 1));
  const trackWidth = Math.max(10, width - 12);
  const filled = Math.round(trackWidth * ratio);
  const bar = `${'█'.repeat(filled)}${'░'.repeat(Math.max(0, trackWidth - filled))}`;
  const percentage = `${Math.round(ratio * 100)}%`.padStart(4);

  return (
    <Box flexDirection="column">
      <Text color={theme.primary}>{progress.label}</Text>
      <Text color={theme.primary}>
        {bar} {percentage}
      </Text>
      {progress.detail ? <Text color={theme.muted}>{progress.detail}</Text> : null}
    </Box>
  );
};
