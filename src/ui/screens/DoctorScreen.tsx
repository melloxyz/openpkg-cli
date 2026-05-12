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
    <Panel title="Doctor" width="52%" footer="Runtime, package manager, container, and Python checks are live.">
      {health ? (
        <Box flexDirection="column">
          <Text color={theme.text}>Platform: {health.platform}</Text>
          <Text color={theme.text}>Node: {health.nodeVersion}</Text>
          <Text color={theme.text}>
            Updates:{' '}
            {health.updatesCheckedAt ? `checked ${new Date(health.updatesCheckedAt).toLocaleString()}` : 'not checked'}
          </Text>
          <Text color={theme.text}>
            Docker:{' '}
            {health.toolAvailability.some((tool) => tool.name === 'docker' && tool.available)
              ? 'available'
              : 'missing'}
          </Text>
          <Text color={theme.text}>
            Python:{' '}
            {health.toolAvailability.some((tool) => tool.name === 'python' && tool.available)
              ? 'available'
              : 'missing'}
          </Text>
          <Text color={theme.muted}>Detected Tools</Text>
          {health.toolAvailability.map((tool) => (
            <Text
              key={`${tool.category}:${tool.name}`}
              color={
                tool.updateStatus === 'outdated'
                  ? theme.warning
                  : tool.updateStatus === 'offline'
                    ? theme.muted
                    : tool.available
                      ? theme.success
                      : theme.warning
              }
            >
              {tool.name.padEnd(8)} {tool.available ? 'ok' : 'missing'}{' '}
              {tool.version ?? ''}
              {tool.latestVersion ? ` -> ${tool.latestVersion}` : ''}
              {tool.updateStatus ? `  [${tool.updateStatus}]` : ''}
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
