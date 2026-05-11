import React from 'react';
import { Box, Text } from 'ink';
import { Sidebar } from '../components/Sidebar.js';
import { theme } from '../../shared/theme.js';
import type { NavigationSection } from '../../types/index.js';

type AppShellProps = {
  activeSection: NavigationSection;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
};

export const AppShell = ({ activeSection, title, subtitle, children, footer }: AppShellProps) => (
  <Box flexDirection="column" paddingX={1} paddingY={1}>
    <Text color={theme.primary}>{title}</Text>
    <Text color={theme.muted}>{subtitle}</Text>
    <Box marginTop={1} gap={1}>
      <Sidebar activeSection={activeSection} />
      <Box flexDirection="column" flexGrow={1}>
        {children}
      </Box>
    </Box>
    <Box marginTop={1}>{footer}</Box>
  </Box>
);
