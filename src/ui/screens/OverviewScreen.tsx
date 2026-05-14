import React from 'react';
import { Box, Text } from 'ink';
import { Panel } from '../components/Panel.js';
import { StatCard } from '../components/StatCard.js';
import { formatBytes } from '../../utils/format.js';
import type {
  CleanupTargetRecord,
  EnvironmentHealthSnapshot,
  ProjectRecord,
  ScanScope
} from '../../types/index.js';
import { theme } from '../../shared/theme.js';
import type { DashboardPrimarySuggestion } from '../../shared/tips.js';
import { getDashboardPrimarySuggestion } from '../../shared/tips.js';
import { getWindowedRows } from '../../utils/list-view.js';
import { fitText, truncatePath, truncateText } from '../../utils/text-layout.js';

type OverviewScreenProps = {
  projects: ProjectRecord[];
  cleanupTargets: CleanupTargetRecord[];
  health: EnvironmentHealthSnapshot | undefined;
  statusLine: string;
  compact: boolean;
  contentWidth: number;
  scope: ScanScope;
  selectedBlockIndex: number;
  viewportSize: number;
  isFocused: boolean;
};

export const OverviewScreen = ({
  projects,
  cleanupTargets,
  health,
  statusLine,
  compact,
  contentWidth,
  scope,
  selectedBlockIndex,
  viewportSize,
  isFocused
}: OverviewScreenProps) => {
  const denseLayout = compact || contentWidth < 108;
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
  const primarySuggestion = getDashboardPrimarySuggestion({
    inactiveProjectCount: inactiveProjects,
    projectCount: projects.length,
    safeCandidateCount: safeCandidates,
    scope,
    ...(health?.recommendations[0] ? { firstHealthRecommendation: health.recommendations[0] } : {})
  });
  const reviewableRatio =
    cleanupBytes > 0 ? Math.min(1, safeCandidateBytes / Math.max(cleanupBytes, 1)) : 0;
  const diskWidth = Math.max(1, Math.min(34, contentWidth - 48));
  const diskFilled = Math.round(diskWidth * reviewableRatio);
  const diskBar = `${'█'.repeat(diskFilled)}${'░'.repeat(diskWidth - diskFilled)}`;
  const selectedProject = projects[0];
  const packageRows = projects.slice(0, denseLayout ? 5 : 8);
  const topCleanupTargets = cleanupTargets.slice(0, denseLayout ? 2 : 3);
  const stackedPanels = compact || contentWidth < 92;
  const statsRows = denseLayout ? [0, 3] : contentWidth < 112 ? [0, 3] : [0];
  const packageNameWidth = Math.max(4, contentWidth < 96 ? Math.min(16, contentWidth - 42) : 23);
  const statusWidth = Math.max(1, Math.min(80, contentWidth - 8));
  const statCards = [
    <StatCard
      key="modules"
      label={denseLayout ? 'Node Mods' : 'Node Modules'}
      value={String(nodeModulesCount)}
      icon="□"
      compact={denseLayout}
    />,
    <StatCard
      key="disk"
      label={denseLayout ? 'Disk' : 'Disk Usage'}
      value={formatBytes(cleanupBytes)}
      icon="▤"
      compact={denseLayout}
    />,
    <StatCard
      key="unused"
      label="Unused"
      value={String(inactiveProjects)}
      icon="×"
      compact={denseLayout}
    />,
    <StatCard
      key="health"
      label={denseLayout ? 'Health' : 'Health Notes'}
      value={String(health?.recommendations.length ?? 0)}
      icon="⌁"
      compact={denseLayout}
    />,
    <StatCard
      key="cache"
      label={denseLayout ? 'Cache' : 'Cache Size'}
      value={formatBytes(cacheBytes)}
      icon="▤"
      compact={denseLayout}
    />
  ];
  const compactStatus = truncateText(statusLine, Math.max(24, contentWidth - 10));

  const renderSuggestionText = (suggestion: DashboardPrimarySuggestion | undefined) => {
    if (!suggestion) {
      return null;
    }

    const tone = suggestion.tone === 'warning' ? theme.warning : theme.primary;
    return (
      <>
        <Text color={tone}>{suggestion.title}</Text>
        <Text color={theme.muted}>
          {truncateText(suggestion.detail, Math.max(24, contentWidth - 8))}
        </Text>
      </>
    );
  };

  const dashboardBlocks = denseLayout
    ? [
        {
          key: 'stats',
          label: 'Summary stats',
          node: (
            <Box flexDirection="column" gap={1}>
              {statsRows.map((start) => (
                <Box key={start} gap={1}>
                  {statCards.slice(start, start === 0 ? 3 : 5)}
                </Box>
              ))}
            </Box>
          )
        },
        {
          key: 'overview',
          label: 'Overview',
          node: (
            <Panel title="Overview" compact footer={compactStatus}>
              <Text color={theme.text}>
                Projects {projects.length} | Cleanup {cleanupTargets.length} | Scope {scope}
              </Text>
              <Text color={safeCandidates > 0 ? theme.warning : theme.muted}>
                Safe candidates {safeCandidates} | Health notes {health?.recommendations.length ?? 0}
              </Text>
              {renderSuggestionText(primarySuggestion)}
            </Panel>
          )
        },
        {
          key: 'cleanup',
          label: 'Cleanup snapshot',
          node: (
            <Panel title="Cleanup Snapshot" compact>
              <Text color={theme.primary}>
                {diskBar} {Math.round(reviewableRatio * 100)}% reviewable
              </Text>
              <Text color={theme.text}>{formatBytes(cleanupBytes)} across cleanup candidates</Text>
              {(topCleanupTargets.length > 0
                ? topCleanupTargets
                : [
                    { id: 'empty-1', path: '~/projects/app/node_modules', sizeInBytes: 0 },
                    { id: 'empty-2', path: '~/.pnpm-store', sizeInBytes: 0 }
                  ]
              ).map((target) => (
                <Box key={target.id} justifyContent="space-between">
                  <Text color={theme.muted}>
                    {truncatePath(target.path, Math.max(1, contentWidth - 22))}
                  </Text>
                  <Text color={theme.text}>{formatBytes(target.sizeInBytes)}</Text>
                </Box>
              ))}
            </Panel>
          )
        },
        {
          key: 'packages',
          label: 'Packages preview',
          node: (
            <Panel title="Packages (Top 5)" compact>
              <Text color={theme.muted}>
                {fitText('Package', Math.max(8, packageNameWidth - 2))} Manager    Status
              </Text>
              {(packageRows.length > 0 ? packageRows : projects).map((project, index) => (
                <Text key={project.id} color={index === 0 ? theme.primary : theme.text}>
                  {index === 0 ? '›' : ' '} {fitText(project.name, Math.max(8, packageNameWidth - 2))}{' '}
                  {fitText(project.packageManager, 10)} {project.activityStatus}
                </Text>
              ))}
              {selectedProject ? (
                <Text color={theme.muted}>
                  Selected: {selectedProject.framework} | {formatBytes(selectedProject.sizeInBytes)}
                </Text>
              ) : (
                <Text color={theme.muted}>Run /scan to populate package signals.</Text>
              )}
            </Panel>
          )
        }
      ]
    : [
        {
          key: 'stats',
          label: 'Summary stats',
          node: (
            <Box gap={1}>
              {statCards.slice(0, 5)}
            </Box>
          )
        },
        {
          key: 'activity',
          label: 'Activity and disk',
          node: (
            <Box gap={1} flexDirection={stackedPanels ? 'column' : 'row'}>
              <Panel title="Recent Actions" compact={denseLayout} {...(stackedPanels ? {} : { width: '46%' })}>
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

              <Panel title="Disk Usage" compact={denseLayout} {...(stackedPanels ? {} : { width: '54%' })}>
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
          )
        },
        ...(primarySuggestion
          ? [
              {
                key: 'suggestion',
                label: 'Suggestion',
                node: (
                  <Panel title="Suggestion" compact={denseLayout}>
                    {renderSuggestionText(primarySuggestion)}
                  </Panel>
                )
              }
            ]
          : []),
        {
          key: 'packages',
          label: 'Packages and selected item',
          node: (
            <Box gap={1} flexDirection={stackedPanels ? 'column' : 'row'}>
              <Panel
                title="Packages (Top 8)"
                compact={denseLayout}
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

              <Panel title="Package Info" compact={denseLayout} {...(stackedPanels ? {} : { width: '37%' })}>
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
          )
        }
      ];

  const visibleBlocks = getWindowedRows(dashboardBlocks, selectedBlockIndex, viewportSize);

  return (
    <Box flexDirection="column" gap={1}>
      {dashboardBlocks.length > viewportSize ? (
        <Text color={isFocused ? theme.primary : theme.muted}>
          Dashboard block {Math.min(dashboardBlocks.length, selectedBlockIndex + 1)}/{dashboardBlocks.length}:{' '}
          {dashboardBlocks[Math.min(dashboardBlocks.length - 1, selectedBlockIndex)]?.label}
        </Text>
      ) : null}
      {visibleBlocks.map(({ value: block }) => (
        <Box key={block.key} flexDirection="column">
          {block.node}
        </Box>
      ))}
    </Box>
  );
};
