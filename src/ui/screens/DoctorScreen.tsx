import React from 'react';
import { Box, Text } from 'ink';
import { Panel } from '../components/Panel.js';
import { theme } from '../../shared/theme.js';
import type { EnvironmentHealthSnapshot } from '../../types/index.js';

type DoctorScreenProps = {
  health: EnvironmentHealthSnapshot | undefined;
};

export const DoctorScreen = ({ health }: DoctorScreenProps) => (
  <Panel
    title="Doctor"
    footer="This module will grow into deeper diagnostics, runtime health, and remediation playbooks."
  >
    {health ? (
      <Box flexDirection="column">
        <Text color={theme.text}>Platform: {health.platform}</Text>
        <Text color={theme.text}>Node: {health.nodeVersion}</Text>
        <Text color={theme.text}>
          Package Managers:{' '}
          {Object.entries(health.packageManagers)
            .map(([name, enabled]) => `${name}:${enabled ? 'ok' : 'missing'}`)
            .join('  ')}
        </Text>
        {health.recommendations.map((recommendation) => (
          <Text key={recommendation} color={theme.warning}>
            • {recommendation}
          </Text>
        ))}
      </Box>
    ) : (
      <Text color={theme.muted}>Run /doctor to collect live environment signals.</Text>
    )}
  </Panel>
);
