import React from 'react';
import { Box, Text } from 'ink';
import { Sidebar } from '../components/Sidebar.js';
import { theme } from '../../shared/theme.js';
import type { NavigationSection } from '../../types/index.js';

type AppShellProps = {
  activeSection: NavigationSection;
  focusArea: 'sidebar' | 'content' | 'command';
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
};

export const AppShell = ({
  activeSection,
  focusArea,
  title,
  subtitle,
  children,
  footer
}: AppShellProps) => (
  <Box flexDirection="column" paddingX={1} paddingY={1}>
    <Text color={theme.primary}>{title}</Text>
    <Text color={theme.muted}>
      {subtitle} Focus: {focusArea}
    </Text>
    <Box marginTop={1} gap={1}>
      <Sidebar activeSection={activeSection} hasFocus={focusArea === 'sidebar'} />
      <Box flexDirection="column" flexGrow={1}>
        {children}
      </Box>
    </Box>
    <Box marginTop={1}>{footer}</Box>
  </Box>
);
