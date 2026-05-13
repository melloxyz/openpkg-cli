import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import { Spinner } from '@inkjs/ui';
import { DashboardController } from '../modules/dashboard/dashboard-controller.js';
import { NAVIGATION_ITEMS } from '../shared/constants.js';
import { renderBrandTitle, theme } from '../shared/theme.js';
import type {
  CleanupTargetRecord,
  DashboardDataSnapshot,
  EnvironmentHealthSnapshot,
  NavigationSection,
  OperationProgress,
  ProjectRecord,
  SettingsSnapshot,
  ScanScope
} from '../types/index.js';
import { useCommandSuggestions } from '../hooks/useCommandInput.js';
import { AppShell } from '../ui/layout/AppShell.js';
import { CommandPalette } from '../ui/components/CommandPalette.js';
import { ProgressBar } from '../ui/components/ProgressBar.js';
import { CleanupScreen } from '../ui/screens/CleanupScreen.js';
import { DoctorScreen } from '../ui/screens/DoctorScreen.js';
import { OverviewScreen } from '../ui/screens/OverviewScreen.js';
import { ProjectsScreen } from '../ui/screens/ProjectsScreen.js';
import { SettingsScreen } from '../ui/screens/SettingsScreen.js';
import { clampIndex } from '../utils/list-view.js';
import {
  getVisibleProjects,
  type ProjectFilterMode,
  type ProjectSortMode
} from '../utils/project-view.js';
import {
  getVisibleCleanupTargets,
  type CleanupFilterMode,
  type CleanupSortMode
} from '../utils/cleanup-view.js';

const sectionOrder = NAVIGATION_ITEMS.map((item) => item.key);
const scanScopes: ScanScope[] = ['workspace', 'developer-home', 'machine'];
const cacheKinds = new Set(['.pnpm-store', '.npm', '.turbo', '.next', 'dist', 'build']);
const controller = new DashboardController();

const nextSection = (current: NavigationSection, direction: 1 | -1) => {
  const currentIndex = sectionOrder.indexOf(current);
  const nextIndex = (currentIndex + direction + sectionOrder.length) % sectionOrder.length;
  return sectionOrder[nextIndex] ?? 'overview';
};

const nextValue = <TValue,>(values: TValue[], currentIndex: number, direction: 1 | -1) => {
  if (values.length === 0) {
    return undefined;
  }

  const nextIndex = (currentIndex + direction + values.length) % values.length;
  return values[nextIndex];
};

const cycleProjectFilter = (current: ProjectFilterMode): ProjectFilterMode => {
  const order: ProjectFilterMode[] = ['all', 'active', 'stale', 'inactive'];
  return nextValue(order, order.indexOf(current), 1) ?? 'all';
};

const cycleProjectSort = (current: ProjectSortMode): ProjectSortMode => {
  const order: ProjectSortMode[] = ['recent', 'size', 'name'];
  return nextValue(order, order.indexOf(current), 1) ?? 'recent';
};

const cycleCleanupFilter = (current: CleanupFilterMode): CleanupFilterMode => {
  const order: CleanupFilterMode[] = ['all', 'safe', 'review', 'active'];
  return nextValue(order, order.indexOf(current), 1) ?? 'all';
};

const cycleCleanupSort = (current: CleanupSortMode): CleanupSortMode => {
  const order: CleanupSortMode[] = ['largest', 'recent', 'kind'];
  return nextValue(order, order.indexOf(current), 1) ?? 'largest';
};

const getDefaultContentViewMode = (isCompact: boolean) => (isCompact ? 'list' : 'split');

export const OpenPkgApp = () => {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [activeSection, setActiveSection] = useState<NavigationSection>('overview');
  const [focusArea, setFocusArea] = useState<'sidebar' | 'content' | 'command'>('sidebar');
  const [statusLine, setStatusLine] = useState('Ready. Press / to open the command palette.');
  const [commandInput, setCommandInput] = useState('');
  const [commandPaletteVisible, setCommandPaletteVisible] = useState(false);
  const [commandSuggestionIndex, setCommandSuggestionIndex] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [operationProgress, setOperationProgress] = useState<OperationProgress>();
  const [roots, setRoots] = useState<string[]>([]);
  const [scope, setScope] = useState<ScanScope>('developer-home');
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [cleanupTargets, setCleanupTargets] = useState<CleanupTargetRecord[]>([]);
  const [health, setHealth] = useState<EnvironmentHealthSnapshot>();
  const [settingsSnapshot, setSettingsSnapshot] = useState<SettingsSnapshot>();
  const [helpLines, setHelpLines] = useState<string[]>(controller.getHelpLines());
  const [projectCursorId, setProjectCursorId] = useState<string | undefined>();
  const [cleanupCursorId, setCleanupCursorId] = useState<string | undefined>();
  const [selectedCleanupIds, setSelectedCleanupIds] = useState<string[]>([]);
  const [pendingDeletionIds, setPendingDeletionIds] = useState<string[] | null>(null);
  const [projectFilter, setProjectFilter] = useState<ProjectFilterMode>('all');
  const [projectSort, setProjectSort] = useState<ProjectSortMode>('recent');
  const [cleanupFilter, setCleanupFilter] = useState<CleanupFilterMode>('all');
  const [cleanupSort, setCleanupSort] = useState<CleanupSortMode>('largest');
  const [terminalWidth, setTerminalWidth] = useState(stdout?.columns ?? 120);
  const [terminalHeight, setTerminalHeight] = useState(stdout?.rows ?? 40);

  const suggestions = useCommandSuggestions(controller.commandRegistry, commandInput);
  const activeTitle = renderBrandTitle(`OpenPkg\nDeveloper Operating Center`);
  const compactLayout = terminalWidth < 110;
  const [contentViewMode, setContentViewMode] = useState<'split' | 'list' | 'detail'>(
    getDefaultContentViewMode(compactLayout)
  );
  const sidebarWidth = compactLayout ? Math.max(24, terminalWidth - 4) : 24;
  const visibleRows = Math.max(5, Math.min(14, terminalHeight - (compactLayout ? 22 : 14)));
  const selectedCleanupIdSet = useMemo(() => new Set(selectedCleanupIds), [selectedCleanupIds]);
  const baseCleanupTargets = useMemo(
    () =>
      activeSection === 'cache'
        ? cleanupTargets.filter((target) => cacheKinds.has(target.kind))
        : cleanupTargets,
    [activeSection, cleanupTargets]
  );
  const visibleProjects = useMemo(
    () => getVisibleProjects(projects, projectFilter, projectSort),
    [projects, projectFilter, projectSort]
  );
  const visibleCleanupTargets = useMemo(
    () => getVisibleCleanupTargets(baseCleanupTargets, cleanupFilter, cleanupSort),
    [baseCleanupTargets, cleanupFilter, cleanupSort]
  );
  const selectedProjectIndex = useMemo(
    () =>
      projectCursorId
        ? visibleProjects.findIndex((project) => project.id === projectCursorId)
        : visibleProjects.length > 0
          ? 0
          : -1,
    [projectCursorId, visibleProjects]
  );
  const selectedCleanupIndex = useMemo(
    () =>
      cleanupCursorId
        ? visibleCleanupTargets.findIndex((target) => target.id === cleanupCursorId)
        : visibleCleanupTargets.length > 0
          ? 0
          : -1,
    [cleanupCursorId, visibleCleanupTargets]
  );
  const previewReclaimableBytes = useMemo(
    () =>
      cleanupTargets
        .filter((target) => selectedCleanupIdSet.has(target.id))
        .reduce((total, target) => total + (target.sizeInBytes ?? 0), 0),
    [cleanupTargets, selectedCleanupIdSet]
  );
  const visibleCleanupTotalBytes = useMemo(
    () => visibleCleanupTargets.reduce((total, target) => total + (target.sizeInBytes ?? 0), 0),
    [visibleCleanupTargets]
  );

  const applySnapshot = (snapshot: DashboardDataSnapshot) => {
    setRoots(snapshot.roots);
    setStatusLine(snapshot.statusLine);

    if (snapshot.scope) {
      setScope(snapshot.scope);
    }

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

    if (snapshot.settings) {
      setSettingsSnapshot(snapshot.settings);
    }
  };

  const executeCommand = async (value: string) => {
    setIsBusy(true);

    try {
      const snapshot = await controller.runCommand(value, {
        onProgress: setOperationProgress,
        scopeOverride: scope
      });
      applySnapshot(snapshot);
    } catch (error) {
      setStatusLine(error instanceof Error ? error.message : 'Command failed unexpectedly.');
    } finally {
      setIsBusy(false);
      setOperationProgress(undefined);
      setCommandPaletteVisible(false);
      setCommandInput('');
      setCommandSuggestionIndex(0);
      setFocusArea('content');
    }
  };

  const refreshCurrentSection = async () => {
    setIsBusy(true);

    try {
      const snapshot = await controller.refreshSection(activeSection, scope, setOperationProgress);
      applySnapshot(snapshot);
    } catch (error) {
      setStatusLine(error instanceof Error ? error.message : 'Refresh failed unexpectedly.');
    } finally {
      setIsBusy(false);
      setOperationProgress(undefined);
    }
  };

  const confirmDeletion = async () => {
    const targetIds = pendingDeletionIds ?? [];
    const targets = cleanupTargets.filter((target) => targetIds.includes(target.id));

    setIsBusy(true);

    try {
      const snapshot = await controller.deleteCleanupTargets(targets, scope, setOperationProgress);
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
      setOperationProgress(undefined);
    }
  };

  const openCommandPalette = () => {
    setCommandPaletteVisible(true);
    setCommandInput('/');
    setCommandSuggestionIndex(0);
    setFocusArea('command');
  };

  const selectVisibleProject = (index: number) => {
    const project = visibleProjects[index];
    if (project) {
      setProjectCursorId(project.id);
    }
  };

  const selectVisibleCleanupTarget = (index: number) => {
    const target = visibleCleanupTargets[index];
    if (target) {
      setCleanupCursorId(target.id);
    }
  };

  const moveContentCursor = (direction: 1 | -1) => {
    if (activeSection === 'projects') {
      const currentIndex = clampIndex(selectedProjectIndex, visibleProjects.length);
      selectVisibleProject(clampIndex(currentIndex + direction, visibleProjects.length));
      return;
    }

    if (activeSection === 'cleanup' || activeSection === 'cache') {
      const currentIndex = clampIndex(selectedCleanupIndex, visibleCleanupTargets.length);
      selectVisibleCleanupTarget(
        clampIndex(currentIndex + direction, visibleCleanupTargets.length)
      );
    }
  };

  const pageContentCursor = (direction: 1 | -1) => {
    if (activeSection === 'projects') {
      const currentIndex = clampIndex(selectedProjectIndex, visibleProjects.length);
      selectVisibleProject(
        clampIndex(currentIndex + direction * visibleRows, visibleProjects.length)
      );
      return;
    }

    if (activeSection === 'cleanup' || activeSection === 'cache') {
      const currentIndex = clampIndex(selectedCleanupIndex, visibleCleanupTargets.length);
      selectVisibleCleanupTarget(
        clampIndex(currentIndex + direction * visibleRows, visibleCleanupTargets.length)
      );
    }
  };

  const firstVisibleCleanupTarget = visibleCleanupTargets[0];
  const currentCleanupTarget =
    visibleCleanupTargets[clampIndex(selectedCleanupIndex, visibleCleanupTargets.length)] ??
    firstVisibleCleanupTarget;

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

  const selectAllCleanupTargets = () => {
    setSelectedCleanupIds(visibleCleanupTargets.map((target) => target.id));
    setStatusLine(`Selected ${visibleCleanupTargets.length} cleanup target(s).`);
  };

  const changeSettingsScope = async (direction: 1 | -1) => {
    const currentIndex = scanScopes.indexOf(scope);
    const nextIndex =
      (Math.max(0, currentIndex) + direction + scanScopes.length) % scanScopes.length;
    const nextScope = scanScopes[nextIndex] ?? 'developer-home';

    setScope(nextScope);
    setStatusLine(`Default command scope set to ${nextScope}.`);
    setIsBusy(true);

    try {
      const snapshot = await controller.refreshSection('settings', nextScope);
      applySnapshot({
        ...snapshot,
        statusLine: `Default command scope set to ${nextScope}.`
      });
    } catch (error) {
      setStatusLine(
        error instanceof Error ? error.message : 'Settings refresh failed unexpectedly.'
      );
    } finally {
      setIsBusy(false);
    }
  };

  const armDeletion = () => {
    const ids =
      selectedCleanupIds.length > 0
        ? selectedCleanupIds
        : currentCleanupTarget
          ? [currentCleanupTarget.id]
          : [];

    if (ids.length === 0) {
      setStatusLine('Select at least one cleanup target before deleting.');
      return;
    }

    setPendingDeletionIds(ids);
    setStatusLine(
      `Deletion armed for ${ids.length} target(s). Preview reclaimable size prepared. Press y to confirm or Esc to cancel.`
    );
  };

  useEffect(() => {
    if (!stdout) {
      return;
    }

    const handleResize = () => {
      setTerminalWidth(stdout.columns ?? 120);
      setTerminalHeight(stdout.rows ?? 40);
    };

    handleResize();
    stdout.on('resize', handleResize);

    return () => {
      stdout.off('resize', handleResize);
    };
  }, [stdout]);

  useEffect(() => {
    void controller.hydrateFromCache().then((snapshot) => {
      applySnapshot(snapshot);
    });

    setIsBusy(true);
    void controller
      .runCommand('/doctor', { onProgress: setOperationProgress })
      .then((snapshot) => {
        applySnapshot(snapshot);
      })
      .catch((error: unknown) => {
        setStatusLine(error instanceof Error ? error.message : 'Initial doctor scan failed.');
      })
      .finally(() => {
        setIsBusy(false);
        setOperationProgress(undefined);
      });
  }, []);

  useEffect(() => {
    if (visibleProjects.length === 0) {
      setProjectCursorId(undefined);
      return;
    }

    if (!projectCursorId || !visibleProjects.some((project) => project.id === projectCursorId)) {
      setProjectCursorId(visibleProjects[0]?.id);
    }
  }, [projectCursorId, visibleProjects]);

  useEffect(() => {
    if (visibleCleanupTargets.length === 0) {
      setCleanupCursorId(undefined);
      return;
    }

    if (
      !cleanupCursorId ||
      !visibleCleanupTargets.some((target) => target.id === cleanupCursorId)
    ) {
      setCleanupCursorId(visibleCleanupTargets[0]?.id);
    }
  }, [cleanupCursorId, visibleCleanupTargets]);

  useEffect(() => {
    setSelectedCleanupIds((current) =>
      current.filter((id) => cleanupTargets.some((target) => target.id === id))
    );
  }, [cleanupTargets]);

  useEffect(() => {
    if (
      compactLayout &&
      (activeSection === 'projects' || activeSection === 'cleanup' || activeSection === 'cache')
    ) {
      setContentViewMode('list');
    }
  }, [activeSection, compactLayout]);

  useEffect(() => {
    setContentViewMode((current) => {
      if (compactLayout) {
        return current === 'split' ? 'list' : current;
      }

      return 'split';
    });
  }, [compactLayout, contentViewMode]);

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
          setCommandInput((current) => {
            const prefix = current.slice(0, suggestion.rangeStart);
            const suffix = current.slice(suggestion.rangeEnd);
            return `${prefix}${suggestion.insertText}${suffix}`;
          });
          setCommandSuggestionIndex(0);
        }
        return;
      }

      if (key.return) {
        const suggestion = suggestions[commandSuggestionIndex];
        const commandToRun =
          commandInput.trim() === '/' && suggestion?.kind === 'command'
            ? suggestion.insertText
            : commandInput;
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
      if (
        key.escape &&
        compactLayout &&
        contentViewMode === 'detail' &&
        (activeSection === 'projects' || activeSection === 'cleanup' || activeSection === 'cache')
      ) {
        setContentViewMode('list');
        return;
      }

      if (key.upArrow || input === 'k') {
        moveContentCursor(-1);
        return;
      }

      if (key.downArrow || input === 'j') {
        moveContentCursor(1);
        return;
      }

      if (key.pageUp) {
        pageContentCursor(-1);
        return;
      }

      if (key.pageDown) {
        pageContentCursor(1);
        return;
      }

      if (key.home) {
        if (activeSection === 'projects') {
          selectVisibleProject(0);
        }

        if (activeSection === 'cleanup' || activeSection === 'cache') {
          selectVisibleCleanupTarget(0);
        }
        return;
      }

      if (key.end) {
        if (activeSection === 'projects') {
          selectVisibleProject(Math.max(0, visibleProjects.length - 1));
        }

        if (activeSection === 'cleanup' || activeSection === 'cache') {
          selectVisibleCleanupTarget(Math.max(0, visibleCleanupTargets.length - 1));
        }
        return;
      }

      if (activeSection === 'settings' && input === '[') {
        void changeSettingsScope(-1);
        return;
      }

      if (activeSection === 'settings' && input === ']') {
        void changeSettingsScope(1);
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

      if ((activeSection === 'cleanup' || activeSection === 'cache') && input === 's') {
        selectAllCleanupTargets();
        return;
      }

      if ((activeSection === 'cleanup' || activeSection === 'cache') && input === 'c') {
        setSelectedCleanupIds([]);
        setStatusLine('Cleanup selection cleared.');
        return;
      }

      if ((activeSection === 'cleanup' || activeSection === 'cache') && input === 'x') {
        armDeletion();
        return;
      }

      if (
        (activeSection === 'projects' ||
          activeSection === 'cleanup' ||
          activeSection === 'cache') &&
        input === 'f'
      ) {
        if (activeSection === 'projects') {
          const nextFilter = cycleProjectFilter(projectFilter);
          setProjectFilter(nextFilter);
          setStatusLine(`Projects filtered to ${nextFilter}.`);
        } else {
          const nextFilter = cycleCleanupFilter(cleanupFilter);
          setCleanupFilter(nextFilter);
          setStatusLine(`Cleanup filtered to ${nextFilter}.`);
        }
        return;
      }

      if (
        (activeSection === 'projects' ||
          activeSection === 'cleanup' ||
          activeSection === 'cache') &&
        input === 'o'
      ) {
        if (activeSection === 'projects') {
          const nextSort = cycleProjectSort(projectSort);
          setProjectSort(nextSort);
          setStatusLine(`Projects sorted by ${nextSort}.`);
        } else {
          const nextSort = cycleCleanupSort(cleanupSort);
          setCleanupSort(nextSort);
          setStatusLine(`Cleanup sorted by ${nextSort}.`);
        }
        return;
      }

      if (key.return && compactLayout) {
        if (
          activeSection === 'projects' ||
          activeSection === 'cleanup' ||
          activeSection === 'cache'
        ) {
          const hasSelection =
            activeSection === 'projects'
              ? visibleProjects.length > 0
              : visibleCleanupTargets.length > 0;

          if (!hasSelection) {
            return;
          }

          setContentViewMode((current) => (current === 'detail' ? 'list' : 'detail'));
          return;
        }
      }
    }
  });

  const mainContent = (() => {
    switch (activeSection) {
      case 'projects':
        return (
          <ProjectsScreen
            projects={visibleProjects}
            selectedIndex={clampIndex(selectedProjectIndex, visibleProjects.length)}
            isFocused={focusArea === 'content'}
            compact={compactLayout}
            visibleRows={visibleRows}
            viewMode={compactLayout ? contentViewMode : 'split'}
            filterMode={projectFilter}
            sortMode={projectSort}
          />
        );
      case 'cache':
        return (
          <CleanupScreen
            cleanupTargets={visibleCleanupTargets}
            title="Cache Inventory"
            selectedIndex={clampIndex(selectedCleanupIndex, visibleCleanupTargets.length)}
            selectedIds={selectedCleanupIdSet}
            isFocused={focusArea === 'content'}
            pendingDeletionCount={pendingDeletionIds?.length ?? 0}
            compact={compactLayout}
            visibleRows={visibleRows}
            previewReclaimableBytes={previewReclaimableBytes}
            totalSizeBytes={visibleCleanupTotalBytes}
            viewMode={compactLayout ? contentViewMode : 'split'}
            filterMode={cleanupFilter}
            sortMode={cleanupSort}
          />
        );
      case 'cleanup':
        return (
          <CleanupScreen
            cleanupTargets={visibleCleanupTargets}
            selectedIndex={clampIndex(selectedCleanupIndex, visibleCleanupTargets.length)}
            selectedIds={selectedCleanupIdSet}
            isFocused={focusArea === 'content'}
            pendingDeletionCount={pendingDeletionIds?.length ?? 0}
            compact={compactLayout}
            visibleRows={visibleRows}
            previewReclaimableBytes={previewReclaimableBytes}
            totalSizeBytes={visibleCleanupTotalBytes}
            viewMode={compactLayout ? contentViewMode : 'split'}
            filterMode={cleanupFilter}
            sortMode={cleanupSort}
          />
        );
      case 'doctor':
        return <DoctorScreen health={health} />;
      case 'settings':
        return (
          <SettingsScreen
            snapshot={settingsSnapshot}
            statusLine={statusLine}
            currentScope={scope}
            roots={roots}
            helpLines={helpLines}
            projectCount={projects.length}
            cleanupCount={cleanupTargets.length}
            healthLoaded={Boolean(health)}
          />
        );
      case 'overview':
      default:
        return (
          <OverviewScreen
            projects={projects}
            cleanupTargets={cleanupTargets}
            health={health}
            statusLine={`${statusLine} Scope: ${scope}. Roots: ${roots.length}.`}
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
      compact={compactLayout}
      sidebarWidth={sidebarWidth}
      footer={
        <Box flexDirection="column" width="100%">
          {isBusy ? (
            <Box flexDirection="column">
              <Spinner label="Working..." />
              {operationProgress ? (
                <ProgressBar progress={operationProgress} width={Math.max(20, terminalWidth - 4)} />
              ) : null}
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
