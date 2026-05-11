import React from 'react';
import { Text } from 'ink';
import { Panel } from '../components/Panel.js';
import { theme } from '../../shared/theme.js';

export const SettingsScreen = () => (
  <Panel
    title="Settings"
    footer="Profiles, plugins, and persisted preferences can anchor here next."
  >
    <Text color={theme.text}>
      OpenPgk is wired for modular services, plugin commands, and future workspace profiles.
    </Text>
  </Panel>
);
