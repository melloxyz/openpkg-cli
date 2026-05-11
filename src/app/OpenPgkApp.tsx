import React, { useEffect, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { Spinner } from '@inkjs/ui';
import { renderBrandTitle, theme } from '../shared/theme.js';
import type {
  CleanupTargetRecord,
  EnvironmentHealthSnapshot,
  NavigationSection,
  ProjectRecord
} from '../types/index.js';
import { AppShell } from '../ui/layout/AppShell.js';
import { OverviewScreen } from '../ui/screens/OverviewScreen.js';
import { ProjectsScreen } from '../ui/screens/ProjectsScreen.js';
import { CleanupScreen } from '../ui/screens/CleanupScreen.js';
import { DoctorScreen } from '../ui/screens/DoctorScreen.js';
import { SettingsScreen } from '../ui/screens/SettingsScreen.js';
import { CommandPalette } from '../ui/components/CommandPalette.js';
import { DashboardController } from '../modules/dashboard/dashboard-controller.js';
import { useCommandSuggestions } from '../hooks/useCommandInput.js';
import { NAVIGATION_ITEMS } from '../shared/constants.js';

const sectionOrder = NAVIGATION_ITEMS.map((item) => item.key);
const controller = new DashboardController();

export const OpenPgkApp = () => {
  const { exit } = useApp();
  const [activeSection, setActiveSection] = useState<NavigationSection>('overview');
  const [statusLine, setStatusLine] = useState('Ready. Press / to open the command palette.');
  const [commandInput, setCommandInput] = useState('');
  const [commandPaletteVisible, setCommandPaletteVisible] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [cleanupTargets, setCleanupTargets] = useState<CleanupTargetRecord[]>([]);
  const [health, setHealth] = useState<EnvironmentHealthSnapshot>();

  const suggestions = useCommandSuggestions(controller.commandRegistry, commandInput);
  const activeTitle = renderBrandTitle(`OpenPgk\nDeveloper Operating Center`);

  const moveSection = (direction: 1 | -1) => {
    const currentIndex = sectionOrder.indexOf(activeSection);
    const nextIndex = (currentIndex + direction + sectionOrder.length) % sectionOrder.length;
    setActiveSection(sectionOrder[nextIndex] ?? 'overview');
  };

  const executeCommand = async (value: string) => {
    setIsBusy(true);

    try {
      await controller.runCommand(value, {
        setSection: setActiveSection,
        setStatus: setStatusLine,
        setProjects,
        setCleanupTargets,
        setHealth
      });
    } catch (error) {
      setStatusLine(error instanceof Error ? error.message : 'Command failed unexpectedly.');
    } finally {
      setIsBusy(false);
      setCommandPaletteVisible(false);
      setCommandInput('');
    }
  };

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
      return;
    }

    if (!commandPaletteVisible && input === '/') {
      setCommandPaletteVisible(true);
      setCommandInput('/');
      return;
    }

    if (commandPaletteVisible) {
      if (key.escape) {
        setCommandPaletteVisible(false);
        setCommandInput('');
        return;
      }

      if (key.return) {
        void executeCommand(commandInput);
        return;
      }

      if (key.backspace || key.delete) {
        setCommandInput((current) => current.slice(0, -1));
        return;
      }

      if (!key.ctrl && !key.meta && input) {
        setCommandInput((current) => `${current}${input}`);
      }

      return;
    }

    if (key.upArrow || input === 'k') {
      moveSection(-1);
      return;
    }

    if (key.downArrow || input === 'j') {
      moveSection(1);
      return;
    }

    if (/^[1-6]$/.test(input)) {
      const item = NAVIGATION_ITEMS[Number(input) - 1];
      if (item) {
        setActiveSection(item.key);
      }
    }
  });

  useEffect(() => {
    setIsBusy(true);
    void executeCommand('/doctor').finally(() => {
      setIsBusy(false);
    });
  }, []);

  const mainContent = (() => {
    switch (activeSection) {
      case 'projects':
        return <ProjectsScreen projects={projects} />;
      case 'cache':
        return <CleanupScreen cleanupTargets={cleanupTargets} title="Cache Inventory" />;
      case 'cleanup':
        return <CleanupScreen cleanupTargets={cleanupTargets} />;
      case 'doctor':
        return <DoctorScreen health={health} />;
      case 'settings':
        return <SettingsScreen />;
      case 'overview':
      default:
        return (
          <OverviewScreen
            projects={projects}
            cleanupTargets={cleanupTargets}
            health={health}
            statusLine={statusLine}
          />
        );
    }
  })();

  return (
    <AppShell
      activeSection={activeSection}
      title={activeTitle}
      subtitle="Fast scans, modular services, and premium keyboard-first workflows."
      footer={
        <Box flexDirection="column" width="100%">
          {isBusy ? (
            <Box>
              <Spinner label="Working..." />
            </Box>
          ) : (
            <Text color={theme.muted}>{statusLine}</Text>
          )}
          <CommandPalette
            input={commandInput}
            suggestions={suggestions}
            visible={commandPaletteVisible}
          />
        </Box>
      }
    >
      {mainContent}
    </AppShell>
  );
};
