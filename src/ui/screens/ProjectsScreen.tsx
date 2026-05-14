import React from 'react';
import { Box, Text } from 'ink';
import type { ProjectRecord } from '../../types/index.js';
import { theme } from '../../shared/theme.js';
import { formatBytes, formatRelativeDate } from '../../utils/format.js';
import { getWindowedRows } from '../../utils/list-view.js';
import type { ProjectFilterMode, ProjectSortMode } from '../../utils/project-view.js';
import { fitText, truncatePath, truncateText } from '../../utils/text-layout.js';
import { Panel } from '../components/Panel.js';

type ProjectsScreenProps = {
  projects: ProjectRecord[];
  selectedIndex: number;
  isFocused: boolean;
  compact: boolean;
  contentWidth: number;
  visibleRows: number;
  viewMode: 'split' | 'list' | 'detail';
  filterMode: ProjectFilterMode;
  sortMode: ProjectSortMode;
};

export const ProjectsScreen = ({
  projects,
  selectedIndex,
  isFocused,
  compact,
  contentWidth,
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
  const listWidth = compact || viewMode === 'list' ? contentWidth : Math.floor(contentWidth * 0.58);
  const detailWidth =
    compact || viewMode === 'detail' ? contentWidth : Math.floor(contentWidth * 0.42);
  const nameWidth = compact
    ? Math.max(4, Math.min(18, listWidth - 34))
    : Math.max(4, Math.min(20, listWidth - 43));
  const frameworkWidth = Math.max(4, Math.min(10, listWidth - nameWidth - 34));
  const listFooter = isFocused
    ? compact
      ? 'j/k move, Pg page, f/o tune, Enter detail, Esc back, / palette.'
      : 'j/k move, Pg page, f/o tune, Esc sidebar, / palette.'
    : 'Tab into content to inspect projects.';
  const detailFooter = compact
    ? 'Enter/Esc returns to list. Esc again returns to sidebar.'
    : 'Framework and runtime signals come from package manifests and lockfiles.';

  const listPanel = (
    <Panel
      title={`Packages ${projects.length} · ${statusSummary}`}
      {...(viewMode === 'detail' && compact ? { flexGrow: 1 } : compact ? {} : { width: '58%' })}
      flexGrow={1}
      footer={truncateText(`${listFooter} Page ${pageNumber}/${pageCount}.`, Math.max(1, listWidth - 4))}
    >
      {projects.length === 0 ? (
        <Text color={theme.muted}>Run /projects or /scan to discover repositories.</Text>
      ) : (
        <Box flexDirection="column">
          <Text color={theme.muted}>
            {compact
              ? `${fitText('Name', nameWidth)} PM      Status    Last`
              : `${fitText('Name', nameWidth)} Framework  PM      Status    Last`}
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
              <Text key={project.id} color={isActive ? theme.primary : theme.text}>
                {compact ? (
                  <>
                    {isActive ? '›' : ' '} {fitText(project.name, nameWidth)}{' '}
                    {fitText(project.packageManager, 7)}{' '}
                    <Text color={tone}>{fitText(project.activityStatus, 8)}</Text>{' '}
                    {formatRelativeDate(project.lastActivityAt)}
                  </>
                ) : (
                  <>
                    {isActive ? '›' : ' '} {fitText(project.name, nameWidth)}{' '}
                    {fitText(project.framework, frameworkWidth)} {fitText(project.packageManager, 7)}{' '}
                    <Text color={tone}>{fitText(project.activityStatus, 8)}</Text>{' '}
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
      title="Package Detail"
      {...(viewMode === 'list' && compact ? { flexGrow: 1 } : compact ? {} : { width: '42%' })}
      flexGrow={1}
      footer={
        truncateText(
          selectedProject ? detailFooter : 'Select a project to inspect metadata and path details.',
          Math.max(1, detailWidth - 4)
        )
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
          <Text color={theme.text}>
            {truncatePath(selectedProject.path, Math.max(1, detailWidth - 4))}
          </Text>
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
