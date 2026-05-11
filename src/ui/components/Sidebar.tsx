import React from 'react';
import { Box, Text } from 'ink';
import { NAVIGATION_ITEMS } from '../../shared/constants.js';
import { theme } from '../../shared/theme.js';
import type { NavigationSection } from '../../types/index.js';

type SidebarProps = {
  activeSection: NavigationSection;
};

export const Sidebar = ({ activeSection }: SidebarProps) => (
  <Box
    width={24}
    minHeight={24}
    flexDirection="column"
    borderStyle="round"
    borderColor={theme.panelBorder}
    paddingX={1}
    paddingY={1}
  >
    <Text color={theme.primary}>Control Center</Text>
    <Box marginTop={1} flexDirection="column">
      {NAVIGATION_ITEMS.map((item) => {
        const active = item.key === activeSection;
        return (
          <Box key={item.key}>
            <Text color={active ? theme.accent : theme.text}>
              {active ? '›' : ' '} {item.label.padEnd(10)} {item.shortcut}
            </Text>
          </Box>
        );
      })}
    </Box>
    <Box marginTop={2} flexDirection="column">
      <Text color={theme.muted}>Hotkeys</Text>
      <Text color={theme.muted}>j/k navigate</Text>
      <Text color={theme.muted}>/ command palette</Text>
      <Text color={theme.muted}>Enter execute</Text>
      <Text color={theme.muted}>Esc dismiss</Text>
    </Box>
  </Box>
);
