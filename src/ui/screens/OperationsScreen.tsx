import React from 'react';
import { Box, Text } from 'ink';
import { Panel } from '../components/Panel.js';
import { theme } from '../../shared/theme.js';
import type { EnvironmentHealthSnapshot, SettingsSnapshot } from '../../types/index.js';
import { fitText, truncateText } from '../../utils/text-layout.js';

type OperationsScreenProps = {
  mode: 'scripts' | 'registry' | 'search';
  helpLines: string[];
  settings: SettingsSnapshot | undefined;
  health: EnvironmentHealthSnapshot | undefined;
  projectCount: number;
  cleanupCount: number;
  contentWidth: number;
};

const modeTitles = {
  scripts: 'Scripts',
  registry: 'Registry',
  search: 'Search'
} as const;

export const OperationsScreen = ({
  mode,
  helpLines,
  settings,
  health,
  projectCount,
  cleanupCount,
  contentWidth
}: OperationsScreenProps) => {
  const commandRows =
    settings?.availableCommands ??
    helpLines.map((line) => {
      const [name = 'command', ...descriptionParts] = line.replace(/^\//, '').split('  ');
      return {
        name,
        description: descriptionParts.join('  ') || line,
        aliases: []
      };
    });
  const lineWidth = Math.max(1, contentWidth - 8);
  const toolRows = health?.toolAvailability.slice(0, 5) ?? [];

  return (
    <Box flexDirection="column" gap={1}>
      <Panel title={modeTitles[mode]}>
        {mode === 'scripts' ? (
          <Box flexDirection="column">
            {[
              ['s', 'Scan workspace', '/scan workspace --force'],
              ['c', 'Review cleanup', '/cleanup --dry-run'],
              ['d', 'Run doctor', '/doctor --force'],
              ['u', 'Check updates', '/updates --force']
            ].map(([shortcut, label, command]) => (
              <Box key={shortcut} justifyContent="space-between">
                <Text color={theme.text}>
                  <Text color={theme.primary}>[{shortcut}]</Text> {label}
                </Text>
                <Text color={theme.muted}>
                  {truncateText(command ?? '', Math.max(12, lineWidth - 24))}
                </Text>
              </Box>
            ))}
            <Box marginTop={1} flexDirection="column">
              <Text color={theme.primary}>Environment Snapshot</Text>
              <Text color={theme.text}>
                {truncateText(
                  `Node ${health?.nodeVersion ?? 'pending'} | ${health?.platform ?? process.platform}`,
                  lineWidth
                )}
              </Text>
              <Text color={theme.text}>
                {truncateText(
                  `Updates: ${health?.updatesCheckedAt ? 'checked' : 'not checked'} | Notes: ${health?.recommendations.length ?? 0}`,
                  lineWidth
                )}
              </Text>
              {toolRows.map((tool) => (
                <Text key={tool.name} color={theme.muted}>
                  {truncateText(
                    `${fitText(tool.name, 8)} ${tool.available ? tool.version ?? 'available' : 'missing'} ${tool.updateStatus ? `(${tool.updateStatus})` : ''}`,
                    lineWidth
                  )}
                </Text>
              ))}
              {!health ? <Text color={theme.muted}>Run [d] Doctor to load diagnostics.</Text> : null}
            </Box>
          </Box>
        ) : null}

        {mode === 'registry' ? (
          <Box flexDirection="column">
            <Text color={theme.text}>Commands registered: {commandRows.length}</Text>
            <Text color={theme.text}>Packages cached: {settings?.cacheState.projectsLoaded ?? projectCount}</Text>
            <Text color={theme.text}>Cleanup targets cached: {settings?.cacheState.cleanupLoaded ?? cleanupCount}</Text>
            <Text color={theme.text}>Health snapshot: {health ? 'ready' : 'pending'}</Text>
            <Box marginTop={1} flexDirection="column">
              {commandRows.slice(0, 7).map((command) => (
                <Text key={command.name} color={theme.muted}>
                  {truncateText(`/${fitText(command.name, 10)} ${command.description}`, lineWidth)}
                </Text>
              ))}
            </Box>
          </Box>
        ) : null}

        {mode === 'search' ? (
          <Box flexDirection="column">
            <Text color={theme.primary}>/</Text>
            <Text color={theme.muted}>Type to search commands, scopes, and flags.</Text>
            <Box marginTop={1} flexDirection="column">
              {(helpLines.length > 0 ? helpLines : ['/scan', '/cleanup', '/doctor'])
                .slice(0, 8)
                .map((line) => (
                  <Text key={line} color={theme.text}>
                    › {truncateText(line, lineWidth - 2)}
                  </Text>
                ))}
            </Box>
          </Box>
        ) : null}
      </Panel>
    </Box>
  );
};
