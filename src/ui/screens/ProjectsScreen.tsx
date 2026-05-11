import React from 'react';
import { Box, Text } from 'ink';
import type { ProjectRecord } from '../../types/index.js';
import { theme } from '../../shared/theme.js';
import { formatBytes, formatRelativeDate } from '../../utils/format.js';
import { Panel } from '../components/Panel.js';

type ProjectsScreenProps = {
  projects: ProjectRecord[];
  selectedIndex: number;
  isFocused: boolean;
  compact: boolean;
  visibleRows: number;
};

const truncate = (value: string, length: number) =>
  value.length > length ? `${value.slice(0, length - 1)}…` : value;

const getWindowedRows = <TValue,>(values: TValue[], selectedIndex: number, size: number) => {
  if (values.length <= size) {
    return values.map((value, index) => ({ value, index }));
  }

  const half = Math.floor(size / 2);
  const start = Math.max(0, Math.min(selectedIndex - half, values.length - size));
  return values.slice(start, start + size).map((value, index) => ({
    value,
    index: start + index
  }));
};

export const ProjectsScreen = ({
  projects,
  selectedIndex,
  isFocused,
  compact,
  visibleRows
}: ProjectsScreenProps) => {
  const selectedProject = projects[selectedIndex];
  const rows = getWindowedRows(projects, selectedIndex, visibleRows);

  return (
    <Box gap={1} flexDirection={compact ? 'column' : 'row'}>
      <Panel
        title={`Projects (${projects.length})`}
        {...(compact ? {} : { width: '58%' })}
        flexGrow={1}
        footer={
          isFocused
            ? 'Focused: j/k move, r refresh, / command palette.'
            : 'Tab into content to inspect projects.'
        }
      >
        {projects.length === 0 ? (
          <Text color={theme.muted}>Run /projects or /scan to discover repositories.</Text>
        ) : (
          <Box flexDirection="column">
            <Text color={theme.muted}>
              {compact ? 'Name             PM      Status    Last Active' : 'Name                 Framework  PM      Status    Last Active'}
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
                      {project.packageManager.padEnd(7)} <Text color={tone}>{project.activityStatus.padEnd(8)}</Text>{' '}
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
      <Panel
        title="Project Detail"
        {...(compact ? {} : { width: '42%' })}
        flexGrow={1}
        footer="Framework and runtime signals come from package manifests and lockfiles."
      >
        {selectedProject ? (
          <Box flexDirection="column">
            <Text color={theme.primary}>{selectedProject.name}</Text>
            <Text color={theme.text}>Framework: {selectedProject.framework}</Text>
            <Text color={theme.text}>Package Manager: {selectedProject.packageManager}</Text>
            <Text color={theme.text}>Footprint: {formatBytes(selectedProject.sizeInBytes)}</Text>
            <Text color={theme.text}>Last Activity: {formatRelativeDate(selectedProject.lastActivityAt)}</Text>
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
    </Box>
  );
};
