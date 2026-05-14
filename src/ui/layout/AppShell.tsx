import React from 'react';
import { Box, Text } from 'ink';
import { Sidebar } from '../components/Sidebar.js';
import { NAVIGATION_ITEMS, OPENPKG_BOX_MARK } from '../../shared/constants.js';
import { APP_VERSION } from '../../shared/app-metadata.js';
import { theme } from '../../shared/theme.js';
import type { NavigationSection } from '../../types/index.js';
import { truncateText } from '../../utils/text-layout.js';

type AppShellProps = {
  activeSection: NavigationSection;
  focusArea: 'sidebar' | 'content' | 'command';
  title: string;
  subtitle: string;
  compact: boolean;
  terminalWidth: number;
  sidebarWidth: number;
  children: React.ReactNode;
  footer: React.ReactNode;
};

export const AppShell = ({
  activeSection,
  focusArea,
  title,
  subtitle,
  compact,
  terminalWidth,
  sidebarWidth,
  children,
  footer
}: AppShellProps) => {
  const fallbackItem = {
    key: 'dashboard',
    label: 'Dashboard',
    shortcut: '1',
    icon: '◇',
    description: 'Mission control and launch lanes.'
  } satisfies (typeof NAVIGATION_ITEMS)[number];
  const currentSectionItem =
    NAVIGATION_ITEMS.find((item) => item.key === activeSection) ?? fallbackItem;
  const focusLabel =
    focusArea === 'sidebar' ? 'navigate' : focusArea === 'content' ? 'inspect' : 'command';
  const meta = `${APP_VERSION} | node ${process.version.slice(1)} | pnpm | workspace active`;
  const compactMeta = `${APP_VERSION} | node ${process.version.slice(1)} | pnpm`;
  const topbarWidth = Math.max(24, terminalWidth - 8);

  return (
    <Box
      flexDirection="column"
      paddingX={1}
      paddingY={1}
      backgroundColor={theme.background}
      borderStyle="round"
      borderColor={theme.panelBorder}
    >
      <Box
        justifyContent="space-between"
        alignItems={compact ? 'flex-start' : 'center'}
        flexDirection={compact ? 'column' : 'row'}
        paddingX={1}
      >
        <Box gap={1} alignItems="center">
          <Text color={theme.primary}>{OPENPKG_BOX_MARK[0]}</Text>
          <Text color={theme.text} bold>
            {title} CLI
          </Text>
          {!compact ? <Text color={theme.muted}>{truncateText(subtitle, 32)}</Text> : null}
        </Box>
        <Text color={theme.muted}>
          {truncateText(compact ? compactMeta : meta, compact ? topbarWidth : 54)}{' '}
          <Text color={theme.success}>●</Text>
        </Text>
      </Box>
      <Box
        marginTop={1}
        borderStyle="single"
        borderColor={theme.panelBorder}
        paddingX={1}
        justifyContent="space-between"
      >
        <Box gap={1}>
          <Text color={theme.primary} bold>
            {currentSectionItem.label.toUpperCase()}
          </Text>
          {!compact ? (
            <Text color={theme.muted}>
              {truncateText(currentSectionItem.description, Math.max(1, terminalWidth - 40))}
            </Text>
          ) : null}
        </Box>
        <Text color={theme.muted}>{focusLabel}</Text>
      </Box>
      <Box marginTop={1} gap={1} flexDirection={compact ? 'column' : 'row'} alignItems="stretch">
        <Sidebar
          activeSection={activeSection}
          hasFocus={focusArea === 'sidebar'}
          width={sidebarWidth}
          compact={compact}
        />
        <Box flexDirection="column" flexGrow={1} minHeight={compact ? 16 : 30}>
          {children}
        </Box>
      </Box>
      <Box marginTop={1}>{footer}</Box>
    </Box>
  );
};
