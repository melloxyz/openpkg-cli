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
  compact?: boolean;
};

export const Panel = ({
  title,
  children,
  footer,
  width,
  minHeight,
  flexGrow,
  compact = false
}: PanelProps) => (
  <Box
    width={width}
    minHeight={minHeight}
    flexGrow={flexGrow}
    flexDirection="column"
    borderStyle="round"
    borderColor={theme.panelBorder}
    backgroundColor={theme.panel}
    paddingX={1}
    paddingY={compact ? 0 : 1}
  >
    <Text color={theme.primary} bold>
      {title.toUpperCase()}
    </Text>
    <Box marginTop={compact ? 0 : 1} flexDirection="column" flexGrow={1}>
      {children}
    </Box>
    {footer ? (
      <Box marginTop={compact ? 0 : 1}>
        <Text color={theme.muted}>{footer}</Text>
      </Box>
    ) : null}
  </Box>
);
