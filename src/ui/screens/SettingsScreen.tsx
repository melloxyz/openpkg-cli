import React from 'react';
import { Box, Text } from 'ink';
import { Panel } from '../components/Panel.js';
import { theme } from '../../shared/theme.js';
import type { SettingsSnapshot } from '../../types/index.js';
import type { ScanScope } from '../../types/index.js';

type SettingsScreenProps = {
  snapshot: SettingsSnapshot | undefined;
  statusLine: string;
  currentScope: ScanScope;
  roots: string[];
  helpLines: string[];
  projectCount: number;
  cleanupCount: number;
  healthLoaded: boolean;
};

type SettingsCommandRecord = {
  name: string;
  description: string;
  aliases: string[];
  usage?: string;
};

export const SettingsScreen = ({
  snapshot,
  statusLine,
  currentScope,
  roots,
  helpLines,
  projectCount,
  cleanupCount,
  healthLoaded
}: SettingsScreenProps) => {
  const settings = {
    scope: currentScope,
    roots: roots.length > 0 ? roots : (snapshot?.roots ?? []),
    availableCommands: snapshot?.availableCommands ?? [],
    cacheState: snapshot?.cacheState ?? {
      projectsLoaded: projectCount,
      cleanupLoaded: cleanupCount,
      healthLoaded
    }
  };
  const commandEntries: SettingsCommandRecord[] =
    settings.availableCommands.length > 0
      ? settings.availableCommands
      : helpLines.slice(0, 6).map((line, index) => ({
          name: `help-${index}`,
          description: line,
          aliases: []
        }));

  return (
    <Box flexDirection="column" gap={1}>
      <Panel title="Workspace Settings" footer="Focused: [ or ] change default scope, r refresh.">
        <Text color={theme.text}>Scope: {settings.scope}</Text>
        <Text color={theme.text}>
          Roots: {settings.roots.length > 0 ? settings.roots.join(' • ') : 'none detected'}
        </Text>
        <Text color={theme.muted}>{statusLine}</Text>
      </Panel>
      <Panel title="Command Registry" footer="Built-in commands stay in sync with the palette.">
        <Text color={theme.text}>Available commands: {settings.availableCommands.length}</Text>
        <Box marginTop={1} flexDirection="column">
          {commandEntries.slice(0, 6).map((command) => (
              <Text key={command.name} color={theme.muted}>
                /{command.name}
                {command.aliases.length > 0 ? ` (${command.aliases.join(', ')})` : ''} -{' '}
                {command.description}
                {command.usage ? ` | ${command.usage}` : ''}
              </Text>
            ))}
        </Box>
      </Panel>
      <Panel title="Snapshot State" footer="This is the same operational state the controller sees.">
        <Text color={theme.text}>
          Projects cached: {settings.cacheState.projectsLoaded} | Cleanup cached:{' '}
          {settings.cacheState.cleanupLoaded} | Health cached:{' '}
          {settings.cacheState.healthLoaded ? 'yes' : 'no'}
        </Text>
        <Text color={theme.muted}>
          Help lines: {helpLines.length} | Projects in view: {projectCount} | Cleanup targets in view:{' '}
          {cleanupCount}
        </Text>
      </Panel>
    </Box>
  );
};
