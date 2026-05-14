import React from 'react';
import { Box, Text } from 'ink';
import { NAVIGATION_ITEMS } from '../../shared/constants.js';
import { theme } from '../../shared/theme.js';
import type { NavigationSection } from '../../types/index.js';

type SidebarProps = {
  activeSection: NavigationSection;
  hasFocus: boolean;
  width: number;
  compact: boolean;
};

export const Sidebar = ({ activeSection, hasFocus, width, compact }: SidebarProps) => {
  return (
    <Box
      width={width}
      minHeight={compact ? 11 : 30}
      flexDirection="column"
      borderStyle="single"
      borderColor={hasFocus ? theme.primary : theme.panelBorder}
      paddingX={compact ? 0 : 1}
      paddingY={1}
    >
      <Text color={theme.text} bold>
        Sections
      </Text>
      <Box flexDirection="column" marginTop={1}>
        {NAVIGATION_ITEMS.map((item) => {
          const active = item.key === activeSection;

          return (
            <Box
              key={item.key}
              paddingX={1}
              backgroundColor={active ? theme.panel : undefined}
              flexDirection="row"
              justifyContent="space-between"
            >
              <Text color={active ? theme.text : theme.muted} bold={active}>
                <Text color={active ? theme.primary : theme.muted}>{active ? '▌' : ' '}</Text>{' '}
                {item.label}
              </Text>
              <Text color={theme.muted} bold={active}>{item.shortcut}</Text>
            </Box>
          );
        })}
      </Box>
      <Box flexGrow={1} />
      <Box>
        <Text color={theme.muted}>{compact ? 'j/k Enter /' : '/ palette  ? help  q quit'}</Text>
      </Box>
    </Box>
  );
};
