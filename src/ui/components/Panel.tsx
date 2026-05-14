import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../shared/theme.js';

type PanelProps = {
  title: string;
  children: React.ReactNode;
  footer?: string;
  width?: number | string;
  minHeight?: number;
  flexGrow?: number;
};

export const Panel = ({ title, children, footer, width, minHeight, flexGrow }: PanelProps) => (
  <Box
    width={width}
    minHeight={minHeight}
    flexGrow={flexGrow}
    flexDirection="column"
    borderStyle="round"
    borderColor={theme.panelBorder}
    backgroundColor={theme.panel}
    paddingX={1}
    paddingY={1}
  >
    <Text color={theme.primary} bold>
      {title.toUpperCase()}
    </Text>
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
