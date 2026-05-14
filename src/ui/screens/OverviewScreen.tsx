import React from 'react';
import { Box, Text } from 'ink';
import { Panel } from '../components/Panel.js';
import { StatCard } from '../components/StatCard.js';
import { formatBytes } from '../../utils/format.js';
import type {
  CleanupTargetRecord,
  EnvironmentHealthSnapshot,
  ProjectRecord
} from '../../types/index.js';
import { theme } from '../../shared/theme.js';
import { fitText, truncatePath, truncateText } from '../../utils/text-layout.js';

type OverviewScreenProps = {
  projects: ProjectRecord[];
  cleanupTargets: CleanupTargetRecord[];
  health: EnvironmentHealthSnapshot | undefined;
  statusLine: string;
  compact: boolean;
  contentWidth: number;
};

export const OverviewScreen = ({
  projects,
  cleanupTargets,
  health,
  statusLine,
  compact,
  contentWidth
}: OverviewScreenProps) => {
  const cleanupBytes = cleanupTargets.reduce(
    (total, record) => total + (record.sizeInBytes ?? 0),
    0
  );
  const nodeModulesCount = cleanupTargets.filter((record) => record.kind === 'node_modules').length;
  const cacheBytes = cleanupTargets
    .filter((record) => record.kind !== 'node_modules')
    .reduce((total, record) => total + (record.sizeInBytes ?? 0), 0);
  const inactiveProjects = projects.filter(
    (project) => project.activityStatus === 'inactive' || project.activityStatus === 'stale'
  ).length;
  const safeCandidates = cleanupTargets.filter((record) => record.recommendation === 'safe').length;
  const safeCandidateBytes = cleanupTargets
    .filter((record) => record.recommendation === 'safe')
    .reduce((total, record) => total + (record.sizeInBytes ?? 0), 0);
  const reviewableRatio =
    cleanupBytes > 0 ? Math.min(1, safeCandidateBytes / Math.max(cleanupBytes, 1)) : 0;
  const diskWidth = Math.max(1, Math.min(34, contentWidth - 48));
  const diskFilled = Math.round(diskWidth * reviewableRatio);
  const diskBar = `${'█'.repeat(diskFilled)}${'░'.repeat(diskWidth - diskFilled)}`;
  const selectedProject = projects[0];
  const packageRows = projects.slice(0, 8);
  const topCleanupTargets = cleanupTargets.slice(0, 3);
  const stackedPanels = compact || contentWidth < 92;
  const statsRows = contentWidth < 112 ? [0, 3] : [0];
  const packageNameWidth = Math.max(4, contentWidth < 96 ? Math.min(16, contentWidth - 42) : 23);
  const statusWidth = Math.max(1, Math.min(80, contentWidth - 8));
  const statCards = [
    <StatCard key="modules" label="Node Modules" value={String(nodeModulesCount)} icon="□" />,
    <StatCard key="disk" label="Disk Usage" value={formatBytes(cleanupBytes)} icon="▤" />,
    <StatCard key="unused" label="Unused" value={String(inactiveProjects)} icon="×" />,
    <StatCard
      key="health"
      label="Health Notes"
      value={String(health?.recommendations.length ?? 0)}
      icon="⌁"
    />,
    <StatCard key="cache" label="Cache Size" value={formatBytes(cacheBytes)} icon="▤" />
  ];

  return (
    <Box flexDirection="column" gap={1}>
      {statsRows.map((start) => (
        <Box key={start} gap={1}>
          {statCards.slice(start, start === 0 && statsRows.length > 1 ? 3 : 5)}
        </Box>
      ))}

      <Box gap={1} flexDirection={stackedPanels ? 'column' : 'row'}>
        <Panel title="Recent Actions" {...(stackedPanels ? {} : { width: '46%' })}>
          <Box flexDirection="column">
            {[
              ['ok', 'Filesystem scan', cleanupTargets.length > 0 ? 'loaded' : 'pending'],
              ['ok', 'Package inventory', projects.length > 0 ? `${projects.length} found` : 'empty'],
              [
                'i',
                'Cleanup candidates',
                cleanupTargets.length > 0 ? `${cleanupTargets.length} found` : 'empty'
              ],
              ['i', 'Environment health', health ? 'loaded' : 'pending']
            ].map(([icon, label, time]) => (
              <Box key={`${label}-${time}`} justifyContent="space-between">
                <Text color={icon === 'ok' ? theme.success : theme.primary}>
                  {icon} <Text color={theme.text}>{label}</Text>
                </Text>
                <Text color={theme.muted}>{time}</Text>
              </Box>
            ))}
          </Box>
        </Panel>

        <Panel title="Disk Usage" {...(stackedPanels ? {} : { width: '54%' })}>
          <Text color={theme.primary}>
            {diskBar} {Math.round(reviewableRatio * 100)}% reviewable
          </Text>
          <Text color={theme.text}>
            {formatBytes(cleanupBytes)} detected across cleanup candidates
          </Text>
          <Box marginTop={1} flexDirection="column">
            {(topCleanupTargets.length > 0
              ? topCleanupTargets
              : [
                  { id: 'empty-1', path: '~/projects/app/node_modules', sizeInBytes: 0 },
                  { id: 'empty-2', path: '~/.pnpm-store', sizeInBytes: 0 }
                ]
            ).map((target) => (
              <Box key={target.id} justifyContent="space-between">
                <Text color={theme.muted}>
                  {truncatePath(target.path, Math.max(1, contentWidth - 28))}
                </Text>
                <Text color={theme.text}>{formatBytes(target.sizeInBytes)}</Text>
              </Box>
            ))}
          </Box>
        </Panel>
      </Box>

      <Box gap={1} flexDirection={stackedPanels ? 'column' : 'row'}>
        <Panel title="Suggestions" {...(stackedPanels ? {} : { width: '46%' })}>
          <Text color={safeCandidates > 0 ? theme.warning : theme.muted}>
            ! {safeCandidates} cleanup target(s) can be reviewed safely
          </Text>
          <Text color={inactiveProjects > 0 ? theme.warning : theme.muted}>
            ! {inactiveProjects} project(s) look stale or inactive
          </Text>
          <Text color={theme.primary}>
            i {health?.recommendations.length ?? 0} environment recommendation(s)
          </Text>
        </Panel>

        <Panel title="Quick Actions" {...(stackedPanels ? {} : { width: '54%' })}>
          <Box gap={2}>
            {[
              ['s', 'Scan'],
              ['c', 'Cleanup'],
              ['d', 'Doctor'],
              ['u', 'Update']
            ].map(([shortcut, label]) => (
              <Box key={shortcut} borderStyle="single" borderColor={theme.panelBorder} paddingX={1}>
                <Text color={theme.text}>
                  <Text color={theme.primary}>[{shortcut}]</Text> {label}
                </Text>
              </Box>
            ))}
          </Box>
        </Panel>
      </Box>

      <Box gap={1} flexDirection={stackedPanels ? 'column' : 'row'}>
        <Panel
          title="Packages (Top 8)"
          {...(stackedPanels ? {} : { width: '63%' })}
          footer={truncateText(statusLine, statusWidth)}
        >
          <Text color={theme.muted}>
            {fitText('Package', packageNameWidth)} Manager    Size      Signals   Status
          </Text>
          <Box flexDirection="column">
            {(packageRows.length > 0 ? packageRows : projects).map((project, index) => (
              <Text key={project.id} color={index === 0 ? theme.primary : theme.text}>
                {index === 0 ? '›' : ' '} {fitText(project.name, packageNameWidth)}{' '}
                {fitText(project.packageManager, 10)} {fitText(formatBytes(project.sizeInBytes), 9)}{' '}
                {fitText(String(project.signals?.length ?? 0), 9)} {project.activityStatus}
              </Text>
            ))}
            {packageRows.length === 0 ? (
              <Text color={theme.muted}>Run /scan to populate package signals.</Text>
            ) : null}
          </Box>
        </Panel>

        <Panel title="Package Info" {...(stackedPanels ? {} : { width: '37%' })}>
          {selectedProject ? (
            <Box flexDirection="column">
              <Text color={theme.text}>Name: {selectedProject.name}</Text>
              <Text color={theme.text}>Manager: {selectedProject.packageManager}</Text>
              <Text color={theme.text}>Framework: {selectedProject.framework}</Text>
              <Text color={theme.text}>Size: {formatBytes(selectedProject.sizeInBytes)}</Text>
              <Text color={theme.text}>Status: {selectedProject.activityStatus}</Text>
              <Box marginTop={1}>
                <Text color={theme.muted}>
                  {truncatePath(selectedProject.path, Math.max(1, contentWidth - 12))}
                </Text>
              </Box>
              <Box marginTop={1} gap={2}>
                <Text color={theme.primary}>[u] Update</Text>
                <Text color={theme.primary}>[/] Commands</Text>
              </Box>
            </Box>
          ) : (
            <Text color={theme.muted}>No package selected yet.</Text>
          )}
        </Panel>
      </Box>
    </Box>
  );
};
