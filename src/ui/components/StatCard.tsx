import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../shared/theme.js';

type StatCardProps = {
  label: string;
  value: string;
  icon?: string;
  tone?: 'primary' | 'success' | 'warning';
  compact?: boolean;
};

const toneColorMap = {
  primary: theme.primary,
  success: theme.text,
  warning: theme.text
} as const;

export const StatCard = ({
  label,
  value,
  icon,
  tone = 'primary',
  compact = false
}: StatCardProps) => (
  <Box
    flexDirection={compact ? 'row' : 'column'}
    borderStyle="round"
    borderColor={theme.panelBorder}
    backgroundColor={theme.panel}
    paddingX={1}
    paddingY={compact ? 0 : 1}
    flexGrow={1}
    minWidth={compact ? 11 : 18}
    justifyContent={compact ? 'space-between' : undefined}
  >
    <Box justifyContent="space-between">
      <Text color={theme.muted}>{label}</Text>
      {icon ? <Text color={theme.muted}>{icon}</Text> : null}
    </Box>
    <Box {...(compact ? {} : { marginTop: 0 })}>
      <Text color={toneColorMap[tone]} bold>
        {value}
      </Text>
    </Box>
  </Box>
);
