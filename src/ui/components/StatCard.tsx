import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../shared/theme.js';

type StatCardProps = {
  label: string;
  value: string;
  tone?: 'primary' | 'success' | 'warning';
};

const toneColorMap = {
  primary: theme.primary,
  success: theme.success,
  warning: theme.warning
} as const;

export const StatCard = ({ label, value, tone = 'primary' }: StatCardProps) => (
  <Box
    flexDirection="column"
    borderStyle="round"
    borderColor={theme.panelBorder}
    paddingX={1}
    paddingY={1}
    width={24}
  >
    <Text color={theme.muted}>{label}</Text>
    <Text color={toneColorMap[tone]}>{value}</Text>
  </Box>
);
