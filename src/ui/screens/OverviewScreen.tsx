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

type OverviewScreenProps = {
  projects: ProjectRecord[];
  cleanupTargets: CleanupTargetRecord[];
  health: EnvironmentHealthSnapshot | undefined;
  statusLine: string;
  helpLines?: string[];
};

export const OverviewScreen = ({
  projects,
  cleanupTargets,
  health,
  statusLine,
  helpLines
}: OverviewScreenProps) => {
  const cleanupBytes = cleanupTargets.reduce(
    (total, record) => total + (record.sizeInBytes ?? 0),
    0
  );
  const safeCandidates = cleanupTargets.filter((record) => record.recommendation === 'safe').length;

  return (
    <Box flexDirection="column" gap={1}>
      <Panel title="Mission Control" footer={statusLine}>
        <Box gap={1}>
          <StatCard label="Projects" value={String(projects.length)} />
          <StatCard label="Cleanup Targets" value={String(cleanupTargets.length)} tone="warning" />
          <StatCard label="Reclaimable" value={formatBytes(cleanupBytes)} tone="success" />
        </Box>
        <Box marginTop={1} flexDirection="column">
          <Text color={theme.text}>
            {safeCandidates} candidate(s) look safe to review for cleanup across recent scans.
          </Text>
          {health ? (
            <Text color={theme.muted}>
              Node {health.nodeVersion} on {health.platform}. Package managers online:{' '}
              {Object.entries(health.packageManagers)
                .filter(([, enabled]) => enabled)
                .map(([name]) => name)
                .join(', ') || 'none'}
            </Text>
          ) : (
            <Text color={theme.muted}>Run /doctor to enrich environment health insights.</Text>
          )}
        </Box>
      </Panel>
      <Panel title="Quick Start" footer="Use /help for the full command list.">
        <Text color={theme.text}>
          /scan discovers projects, caches, and environment health in one flow.
        </Text>
        <Text color={theme.text}>
          /projects focuses on local repositories and framework detection.
        </Text>
        <Text color={theme.text}>
          /cleanup shows heavyweight artifacts with safe-review recommendations.
        </Text>
      </Panel>
      <Panel
        title="Command Deck"
        footer="Keyboard: Tab switches focus, r refreshes, and cleanup uses space/x/y for live deletions."
      >
        <Box flexDirection="column">
          {(helpLines && helpLines.length > 0 ? helpLines : [
            '/scan  refresh projects, caches, and doctor',
            '/projects  discover local repositories',
            '/cleanup  inspect cleanup candidates',
            '/cleanup --delete-safe  remove only safe items',
            '/doctor  check tools and runtimes'
          ]).map((line) => (
            <Text key={line} color={theme.muted}>
              {line}
            </Text>
          ))}
        </Box>
      </Panel>
    </Box>
  );
};
