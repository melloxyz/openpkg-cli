import React from 'react';
import { Box, Text } from 'ink';
import type { ProjectRecord } from '../../types/index.js';
import { theme } from '../../shared/theme.js';
import { formatBytes, formatRelativeDate } from '../../utils/format.js';
import { getWindowedRows } from '../../utils/list-view.js';
import type { ProjectFilterMode, ProjectSortMode } from '../../utils/project-view.js';
import { Panel } from '../components/Panel.js';

type ProjectsScreenProps = {
  projects: ProjectRecord[];
  selectedIndex: number;
  isFocused: boolean;
  compact: boolean;
  visibleRows: number;
  viewMode: 'split' | 'list' | 'detail';
  filterMode: ProjectFilterMode;
  sortMode: ProjectSortMode;
};

const truncate = (value: string, length: number) =>
  value.length > length ? `${value.slice(0, length - 1)}…` : value;

export const ProjectsScreen = ({
  projects,
  selectedIndex,
  isFocused,
  compact,
  visibleRows,
  viewMode,
  filterMode,
  sortMode
}: ProjectsScreenProps) => {
  const selectedProject = projects[selectedIndex];
  const rows = getWindowedRows(projects, selectedIndex, visibleRows);
  const pageSize = Math.max(1, visibleRows);
  const pageCount = Math.max(1, Math.ceil(Math.max(1, projects.length) / pageSize));
  const pageNumber = Math.min(pageCount, Math.floor(Math.max(0, selectedIndex) / pageSize) + 1);
  const statusSummary = `${filterMode === 'all' ? 'all activity' : filterMode} • ${sortMode}`;
  const listFooter = isFocused
    ? compact
      ? 'j/k move, PgUp/PgDn page, f filter, o sort, Enter drill down, / command palette.'
      : 'j/k move, PgUp/PgDn page, f filter, o sort, / command palette.'
    : 'Tab into content to inspect projects.';
  const detailFooter = compact
    ? 'Enter or Esc returns to the list. PgUp/PgDn keeps paging through the current selection.'
    : 'Framework and runtime signals come from package manifests and lockfiles.';

  const listPanel = (
    <Panel
      title={`Projects (${projects.length}) · ${statusSummary}`}
      {...(viewMode === 'detail' && compact ? { flexGrow: 1 } : compact ? {} : { width: '58%' })}
      flexGrow={1}
      footer={`${listFooter} Page ${pageNumber}/${pageCount}.`}
    >
      {projects.length === 0 ? (
        <Text color={theme.muted}>Run /projects or /scan to discover repositories.</Text>
      ) : (
        <Box flexDirection="column">
          <Text color={theme.muted}>
            {compact
              ? 'Name             PM      Status    Last Active'
              : 'Name                 Framework  PM      Status    Last Active'}
          </Text>
          {rows.map(({ value: project, index }) => {
            const isActive = index === selectedIndex;
            const tone =
              project.activityStatus === 'active'
                ? theme.success
                : project.activityStatus === 'stale'
                  ? theme.warning
                  : theme.muted;

            return (
              <Text key={project.id} color={isActive ? theme.accent : theme.text}>
                {compact ? (
                  <>
                    {isActive ? '›' : ' '} {truncate(project.name.padEnd(16), 16)}{' '}
                    {project.packageManager.padEnd(7)}{' '}
                    <Text color={tone}>{project.activityStatus.padEnd(8)}</Text>{' '}
                    {formatRelativeDate(project.lastActivityAt)}
                  </>
                ) : (
                  <>
                    {isActive ? '›' : ' '} {truncate(project.name.padEnd(20), 20)}{' '}
                    {project.framework.padEnd(9)} {project.packageManager.padEnd(7)}{' '}
                    <Text color={tone}>{project.activityStatus.padEnd(8)}</Text>{' '}
                    {formatRelativeDate(project.lastActivityAt)}
                  </>
                )}
              </Text>
            );
          })}
        </Box>
      )}
    </Panel>
  );

  const detailPanel = (
    <Panel
      title="Project Detail"
      {...(viewMode === 'list' && compact ? { flexGrow: 1 } : compact ? {} : { width: '42%' })}
      flexGrow={1}
      footer={
        selectedProject ? detailFooter : 'Select a project to inspect metadata and path details.'
      }
    >
      {selectedProject ? (
        <Box flexDirection="column">
          <Text color={theme.primary}>{selectedProject.name}</Text>
          <Text color={theme.text}>Framework: {selectedProject.framework}</Text>
          <Text color={theme.text}>Package Manager: {selectedProject.packageManager}</Text>
          <Text color={theme.text}>Footprint: {formatBytes(selectedProject.sizeInBytes)}</Text>
          <Text color={theme.text}>
            Last Activity: {formatRelativeDate(selectedProject.lastActivityAt)}
          </Text>
          {selectedProject.signals?.length ? (
            <Text color={theme.text}>Signals: {selectedProject.signals.join(', ')}</Text>
          ) : null}
          <Text color={theme.muted}>Path</Text>
          <Text color={theme.text}>{selectedProject.path}</Text>
        </Box>
      ) : (
        <Text color={theme.muted}>Select a project to inspect metadata and path details.</Text>
      )}
    </Panel>
  );

  if (viewMode === 'list') {
    return <Box>{listPanel}</Box>;
  }

  if (viewMode === 'detail') {
    return <Box>{detailPanel}</Box>;
  }

  return (
    <Box gap={1} flexDirection={compact ? 'column' : 'row'}>
      {listPanel}
      {detailPanel}
    </Box>
  );
};
