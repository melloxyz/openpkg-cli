import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../shared/theme.js';

type TableProps = {
  headers: string[];
  rows: string[][];
};

export const Table = ({ headers, rows }: TableProps) => (
  <Box flexDirection="column">
    <Text color={theme.muted}>{headers.join('   ')}</Text>
    {rows.map((row, index) => (
      <Text key={`${row.join('|')}-${index}`} color={theme.text}>
        {row.join('   ')}
      </Text>
    ))}
  </Box>
);
