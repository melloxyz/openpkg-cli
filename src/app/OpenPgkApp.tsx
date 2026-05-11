import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { Spinner } from '@inkjs/ui';
import { DashboardController } from '../modules/dashboard/dashboard-controller.js';
import { NAVIGATION_ITEMS } from '../shared/constants.js';
import { renderBrandTitle, theme } from '../shared/theme.js';
import type {
  CleanupTargetRecord,
  DashboardDataSnapshot,
  EnvironmentHealthSnapshot,
  NavigationSection,
  ProjectRecord
} from '../types/index.js';
import { useCommandSuggestions } from '../hooks/useCommandInput.js';
import { AppShell } from '../ui/layout/AppShell.js';
import { CommandPalette } from '../ui/components/CommandPalette.js';
import { CleanupScreen } from '../ui/screens/CleanupScreen.js';
import { DoctorScreen } from '../ui/screens/DoctorScreen.js';
import { OverviewScreen } from '../ui/screens/OverviewScreen.js';
import { ProjectsScreen } from '../ui/screens/ProjectsScreen.js';
import { SettingsScreen } from '../ui/screens/SettingsScreen.js';

const sectionOrder = NAVIGATION_ITEMS.map((item) => item.key);
const cacheKinds = new Set(['.pnpm-store', '.npm', '.turbo', '.next', 'dist', 'build']);
const controller = new DashboardController();

const clampIndex = (value: number, length: number) => {
  if (length <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(value, length - 1));
};

const nextSection = (current: NavigationSection, direction: 1 | -1) => {
  const currentIndex = sectionOrder.indexOf(current);
  const nextIndex = (currentIndex + direction + sectionOrder.length) % sectionOrder.length;
  return sectionOrder[nextIndex] ?? 'overview';
};

export const OpenPgkApp = () => {
  const { exit } = useApp();
  const [activeSection, setActiveSection] = useState<NavigationSection>('overview');
  const [focusArea, setFocusArea] = useState<'sidebar' | 'content' | 'command'>('sidebar');
  const [statusLine, setStatusLine] = useState('Ready. Press / to open the command palette.');
  const [commandInput, setCommandInput] = useState('');
  const [commandPaletteVisible, setCommandPaletteVisible] = useState(false);
  const [commandSuggestionIndex, setCommandSuggestionIndex] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [roots, setRoots] = useState<string[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [cleanupTargets, setCleanupTargets] = useState<CleanupTargetRecord[]>([]);
  const [health, setHealth] = useState<EnvironmentHealthSnapshot>();
  const [helpLines, setHelpLines] = useState<string[]>(controller.getHelpLines());
  const [projectCursor, setProjectCursor] = useState(0);
  const [cleanupCursor, setCleanupCursor] = useState(0);
  const [selectedCleanupIds, setSelectedCleanupIds] = useState<string[]>([]);
  const [pendingDeletionIds, setPendingDeletionIds] = useState<string[] | null>(null);

  const suggestions = useCommandSuggestions(controller.commandRegistry, commandInput);
  const activeTitle = renderBrandTitle(`OpenPgk\nDeveloper Operating Center`);
  const selectedCleanupIdSet = useMemo(() => new Set(selectedCleanupIds), [selectedCleanupIds]);
  const visibleCleanupTargets = useMemo(
    () =>
      activeSection === 'cache'
        ? cleanupTargets.filter((target) => cacheKinds.has(target.kind))
        : cleanupTargets,
    [activeSection, cleanupTargets]
  );

  const applySnapshot = (snapshot: DashboardDataSnapshot) => {
    setRoots(snapshot.roots);
    setStatusLine(snapshot.statusLine);

    if (snapshot.projects) {
      setProjects(snapshot.projects);
    }

    if (snapshot.cleanupTargets) {
      setCleanupTargets(snapshot.cleanupTargets);
    }

    if (snapshot.health) {
      setHealth(snapshot.health);
    }

    if (snapshot.activeSection) {
      setActiveSection(snapshot.activeSection);
    }

    if (snapshot.helpLines) {
      setHelpLines(snapshot.helpLines);
    }
  };

  const executeCommand = async (value: string) => {
    setIsBusy(true);

    try {
      const snapshot = await controller.runCommand(value);
      applySnapshot(snapshot);
    } catch (error) {
      setStatusLine(error instanceof Error ? error.message : 'Command failed unexpectedly.');
    } finally {
      setIsBusy(false);
      setCommandPaletteVisible(false);
      setCommandInput('');
      setCommandSuggestionIndex(0);
      setFocusArea('content');
    }
  };

  const refreshCurrentSection = async () => {
    setIsBusy(true);

    try {
      const snapshot = await controller.refreshSection(activeSection);
      applySnapshot(snapshot);
    } catch (error) {
      setStatusLine(error instanceof Error ? error.message : 'Refresh failed unexpectedly.');
    } finally {
      setIsBusy(false);
    }
  };

  const confirmDeletion = async () => {
    const targetIds = pendingDeletionIds ?? [];
    const targets = cleanupTargets.filter((target) => targetIds.includes(target.id));

    setIsBusy(true);

    try {
      const snapshot = await controller.deleteCleanupTargets(targets);
      applySnapshot(snapshot);
      if (activeSection === 'cache') {
        setActiveSection('cache');
      }
      setSelectedCleanupIds((current) => current.filter((id) => !targetIds.includes(id)));
      setPendingDeletionIds(null);
    } catch (error) {
      setStatusLine(error instanceof Error ? error.message : 'Deletion failed unexpectedly.');
    } finally {
      setIsBusy(false);
    }
  };

  const openCommandPalette = () => {
    setCommandPaletteVisible(true);
    setCommandInput('/');
    setCommandSuggestionIndex(0);
    setFocusArea('command');
  };

  const moveContentCursor = (direction: 1 | -1) => {
    if (activeSection === 'projects') {
      setProjectCursor((current) => clampIndex(current + direction, projects.length));
      return;
    }

    if (activeSection === 'cleanup' || activeSection === 'cache') {
      setCleanupCursor((current) =>
        clampIndex(current + direction, visibleCleanupTargets.length)
      );
    }
  };

  const currentCleanupTarget = visibleCleanupTargets[clampIndex(cleanupCursor, visibleCleanupTargets.length)];

  const toggleCleanupSelection = () => {
    if (!currentCleanupTarget) {
      return;
    }

    setSelectedCleanupIds((current) =>
      current.includes(currentCleanupTarget.id)
        ? current.filter((id) => id !== currentCleanupTarget.id)
        : [...current, currentCleanupTarget.id]
    );
  };

  const selectSafeCleanupTargets = () => {
    setSelectedCleanupIds(
      visibleCleanupTargets
        .filter((target) => target.recommendation === 'safe')
        .map((target) => target.id)
    );
  };

  const armDeletion = () => {
    const ids = selectedCleanupIds.length > 0 ? selectedCleanupIds : currentCleanupTarget ? [currentCleanupTarget.id] : [];

    if (ids.length === 0) {
      setStatusLine('Select at least one cleanup target before deleting.');
      return;
    }

    setPendingDeletionIds(ids);
    setStatusLine(`Deletion armed for ${ids.length} target(s). Press y to confirm or Esc to cancel.`);
  };

  useEffect(() => {
    void controller.hydrateFromCache().then((snapshot) => {
      applySnapshot(snapshot);
    });

    setIsBusy(true);
    void controller
      .runCommand('/doctor')
      .then((snapshot) => {
        applySnapshot(snapshot);
      })
      .catch((error: unknown) => {
        setStatusLine(error instanceof Error ? error.message : 'Initial doctor scan failed.');
      })
      .finally(() => {
        setIsBusy(false);
      });
  }, []);

  useEffect(() => {
    setProjectCursor((current) => clampIndex(current, projects.length));
  }, [projects.length]);

  useEffect(() => {
    setCleanupCursor((current) => clampIndex(current, visibleCleanupTargets.length));
  }, [visibleCleanupTargets.length]);

  useEffect(() => {
    setSelectedCleanupIds((current) =>
      current.filter((id) => cleanupTargets.some((target) => target.id === id))
    );
  }, [cleanupTargets]);

  useEffect(() => {
    if (commandPaletteVisible) {
      setCommandSuggestionIndex((current) => clampIndex(current, suggestions.length));
    }
  }, [commandPaletteVisible, suggestions.length]);

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
      return;
    }

    if (pendingDeletionIds) {
      if (key.escape || input === 'n') {
        setPendingDeletionIds(null);
        setStatusLine('Deletion cancelled.');
        return;
      }

      if (input === 'y' || key.return) {
        void confirmDeletion();
      }

      return;
    }

    if (!commandPaletteVisible && input === '/') {
      openCommandPalette();
      return;
    }

    if (commandPaletteVisible) {
      if (key.escape) {
        setCommandPaletteVisible(false);
        setCommandInput('');
        setCommandSuggestionIndex(0);
        setFocusArea('content');
        return;
      }

      if (key.upArrow || input === 'k') {
        setCommandSuggestionIndex((current) => clampIndex(current - 1, suggestions.length));
        return;
      }

      if (key.downArrow || input === 'j') {
        setCommandSuggestionIndex((current) => clampIndex(current + 1, suggestions.length));
        return;
      }

      if (key.tab) {
        const suggestion = suggestions[commandSuggestionIndex];
        if (suggestion) {
          setCommandInput(`/${suggestion.definition.name}`);
          setCommandSuggestionIndex(0);
        }
        return;
      }

      if (key.return) {
        const suggestion = suggestions[commandSuggestionIndex];
        const commandToRun =
          commandInput.trim() === '/' && suggestion ? `/${suggestion.definition.name}` : commandInput;
        void executeCommand(commandToRun);
        return;
      }

      if (key.backspace || key.delete) {
        setCommandInput((current) => current.slice(0, -1));
        setCommandSuggestionIndex(0);
        return;
      }

      if (!key.ctrl && !key.meta && input) {
        setCommandInput((current) => `${current}${input}`);
        setCommandSuggestionIndex(0);
      }

      return;
    }

    if (key.tab) {
      setFocusArea((current) => (current === 'sidebar' ? 'content' : 'sidebar'));
      return;
    }

    if (key.leftArrow || input === 'h') {
      setFocusArea('sidebar');
      return;
    }

    if (key.rightArrow || input === 'l') {
      setFocusArea('content');
      return;
    }

    if (/^[1-6]$/.test(input)) {
      const item = NAVIGATION_ITEMS[Number(input) - 1];
      if (item) {
        setActiveSection(item.key);
      }
      return;
    }

    if (input === 'r') {
      void refreshCurrentSection();
      return;
    }

    if (focusArea === 'sidebar') {
      if (key.upArrow || input === 'k') {
        setActiveSection((current) => nextSection(current, -1));
        return;
      }

      if (key.downArrow || input === 'j') {
        setActiveSection((current) => nextSection(current, 1));
        return;
      }

      if (key.return) {
        setFocusArea('content');
      }

      return;
    }

    if (focusArea === 'content') {
      if (key.upArrow || input === 'k') {
        moveContentCursor(-1);
        return;
      }

      if (key.downArrow || input === 'j') {
        moveContentCursor(1);
        return;
      }

      if ((activeSection === 'cleanup' || activeSection === 'cache') && input === ' ') {
        toggleCleanupSelection();
        return;
      }

      if ((activeSection === 'cleanup' || activeSection === 'cache') && input === 'a') {
        selectSafeCleanupTargets();
        return;
      }

      if ((activeSection === 'cleanup' || activeSection === 'cache') && input === 'c') {
        setSelectedCleanupIds([]);
        setStatusLine('Cleanup selection cleared.');
        return;
      }

      if ((activeSection === 'cleanup' || activeSection === 'cache') && input === 'x') {
        armDeletion();
      }
    }
  });

  const mainContent = (() => {
    switch (activeSection) {
      case 'projects':
        return (
          <ProjectsScreen
            projects={projects}
            selectedIndex={clampIndex(projectCursor, projects.length)}
            isFocused={focusArea === 'content'}
          />
        );
      case 'cache':
        return (
          <CleanupScreen
            cleanupTargets={visibleCleanupTargets}
            title="Cache Inventory"
            selectedIndex={clampIndex(cleanupCursor, visibleCleanupTargets.length)}
            selectedIds={selectedCleanupIdSet}
            isFocused={focusArea === 'content'}
            pendingDeletionCount={pendingDeletionIds?.length ?? 0}
          />
        );
      case 'cleanup':
        return (
          <CleanupScreen
            cleanupTargets={visibleCleanupTargets}
            selectedIndex={clampIndex(cleanupCursor, visibleCleanupTargets.length)}
            selectedIds={selectedCleanupIdSet}
            isFocused={focusArea === 'content'}
            pendingDeletionCount={pendingDeletionIds?.length ?? 0}
          />
        );
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
            statusLine={`${statusLine} Roots: ${roots.length}.`}
            helpLines={helpLines}
          />
        );
    }
  })();

  return (
    <AppShell
      activeSection={activeSection}
      focusArea={focusArea}
      title={activeTitle}
      subtitle="Fast scans, modular services, and premium keyboard-first workflows."
      footer={
        <Box flexDirection="column" width="100%">
          {isBusy ? (
            <Box>
              <Spinner label="Working..." />
            </Box>
          ) : (
            <Text color={pendingDeletionIds ? theme.danger : theme.muted}>{statusLine}</Text>
          )}
          <CommandPalette
            input={commandInput}
            suggestions={suggestions}
            visible={commandPaletteVisible}
            selectedIndex={commandSuggestionIndex}
          />
        </Box>
      }
    >
      {mainContent}
    </AppShell>
  );
};
