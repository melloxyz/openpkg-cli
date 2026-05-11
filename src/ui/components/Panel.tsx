import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../shared/theme.js';

type PanelProps = {
  title: string;
  children: React.ReactNode;
  footer?: string;
  width?: number | string;
  minHeight?: number;
};

export const Panel = ({ title, children, footer, width, minHeight }: PanelProps) => (
  <Box
    width={width}
    minHeight={minHeight}
    flexDirection="column"
    borderStyle="round"
    borderColor={theme.panelBorder}
    paddingX={1}
    paddingY={1}
  >
    <Text color={theme.primary}>{title}</Text>
    <Box marginTop={1} flexDirection="column" flexGrow={1}>
      {children}
    </Box>
    {footer ? (
      <Box marginTop={1}>
        <Text color={theme.muted}>{footer}</Text>
      </Box>
    ) : null}
  </Box>
);
