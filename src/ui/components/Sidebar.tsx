import React from 'react';
import { Box, Text } from 'ink';
import { NAVIGATION_ITEMS } from '../../shared/constants.js';
import { theme } from '../../shared/theme.js';
import type { NavigationSection } from '../../types/index.js';

type SidebarProps = {
  activeSection: NavigationSection;
  hasFocus: boolean;
};

export const Sidebar = ({ activeSection, hasFocus }: SidebarProps) => (
  <Box
    width={24}
    minHeight={24}
    flexDirection="column"
    borderStyle="round"
    borderColor={hasFocus ? theme.primary : theme.panelBorder}
    paddingX={1}
    paddingY={1}
  >
    <Text color={theme.primary}>Control Center</Text>
    <Text color={theme.muted}>{hasFocus ? 'Sidebar focus' : 'Content focus'}</Text>
    <Box marginTop={1} flexDirection="column">
      {NAVIGATION_ITEMS.map((item) => {
        const active = item.key === activeSection;
        return (
          <Box key={item.key}>
            <Text color={active ? theme.accent : theme.text}>
              {active ? '›' : ' '} {item.label.padEnd(10)} {item.shortcut}{' '}
              {hasFocus && active ? '•' : ' '}
            </Text>
          </Box>
        );
      })}
    </Box>
    <Box marginTop={2} flexDirection="column">
      <Text color={theme.muted}>Hotkeys</Text>
      <Text color={theme.muted}>Tab switch focus</Text>
      <Text color={theme.muted}>j/k move</Text>
      <Text color={theme.muted}>/ command palette</Text>
      <Text color={theme.muted}>r refresh section</Text>
      <Text color={theme.muted}>x delete selected</Text>
    </Box>
  </Box>
);
