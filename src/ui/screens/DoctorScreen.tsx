import React from 'react';
import { Box, Text } from 'ink';
import type { EnvironmentHealthSnapshot } from '../../types/index.js';
import { theme } from '../../shared/theme.js';
import { Panel } from '../components/Panel.js';

type DoctorScreenProps = {
  health: EnvironmentHealthSnapshot | undefined;
};

export const DoctorScreen = ({ health }: DoctorScreenProps) => (
  <Box gap={1}>
    <Panel title="Doctor" width="52%" footer="Runtime, package manager, and container checks are live.">
      {health ? (
        <Box flexDirection="column">
          <Text color={theme.text}>Platform: {health.platform}</Text>
          <Text color={theme.text}>Node: {health.nodeVersion}</Text>
          <Text color={theme.muted}>Detected Tools</Text>
          {health.toolAvailability.map((tool) => (
            <Text
              key={`${tool.category}:${tool.name}`}
              color={tool.available ? theme.success : theme.warning}
            >
              {tool.name.padEnd(8)} {tool.available ? 'ok' : 'missing'}{' '}
              {tool.version ?? ''}
            </Text>
          ))}
        </Box>
      ) : (
        <Text color={theme.muted}>Run /doctor to collect live environment signals.</Text>
      )}
    </Panel>
    <Panel title="Recommendations" width="48%" footer="Use /doctor --cached for a faster cached snapshot.">
      {health?.recommendations.length ? (
        <Box flexDirection="column">
          {health.recommendations.map((recommendation) => (
            <Text key={recommendation} color={theme.warning}>
              • {recommendation}
            </Text>
          ))}
        </Box>
      ) : (
        <Text color={theme.success}>No immediate environment warnings detected.</Text>
      )}
    </Panel>
  </Box>
);
