import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../shared/theme.js';

type StatCardProps = {
  label: string;
  value: string;
  icon?: string;
  tone?: 'primary' | 'success' | 'warning';
};

const toneColorMap = {
  primary: theme.primary,
  success: theme.text,
  warning: theme.text
} as const;

export const StatCard = ({ label, value, icon, tone = 'primary' }: StatCardProps) => (
  <Box
    flexDirection="column"
    borderStyle="round"
    borderColor={theme.panelBorder}
    backgroundColor={theme.panel}
    paddingX={1}
    paddingY={1}
    flexGrow={1}
    minWidth={18}
  >
    <Box justifyContent="space-between">
      <Text color={theme.muted}>{label}</Text>
      {icon ? <Text color={theme.muted}>{icon}</Text> : null}
    </Box>
    <Text color={toneColorMap[tone]} bold>
      {value}
    </Text>
  </Box>
);
