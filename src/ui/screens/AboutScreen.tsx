import React from 'react';
import { Box, Text } from 'ink';
import { Panel } from '../components/Panel.js';
import {
  APP_AUTHOR,
  APP_DESCRIPTION,
  APP_HOMEPAGE,
  APP_ISSUES_URL,
  APP_LATEST_RELEASE,
  APP_NAME,
  APP_REPOSITORY_URL,
  APP_ROADMAP_STATUS,
  APP_VERSION
} from '../../shared/app-metadata.js';
import { theme } from '../../shared/theme.js';
import type { EnvironmentHealthSnapshot, ScanScope } from '../../types/index.js';
import { getWindowedRows } from '../../utils/list-view.js';
import { truncatePath, truncateText } from '../../utils/text-layout.js';

type AboutScreenProps = {
  health: EnvironmentHealthSnapshot | undefined;
  currentScope: ScanScope;
  roots: string[];
  projectCount: number;
  cleanupCount: number;
  compact: boolean;
  contentWidth: number;
  selectedBlockIndex: number;
  viewportSize: number;
  isFocused: boolean;
};

export const AboutScreen = ({
  health,
  currentScope,
  roots,
  projectCount,
  cleanupCount,
  compact,
  contentWidth,
  selectedBlockIndex,
  viewportSize,
  isFocused
}: AboutScreenProps) => {
  const denseLayout = compact || contentWidth < 108;
  const stackedPanels = compact || contentWidth < 96;
  const versionLine = `${APP_NAME} ${APP_VERSION}`;
  const environmentNode = health?.nodeVersion ?? process.version.slice(1);
  const environmentPlatform = health?.platform ?? process.platform;
  const linkWidth = Math.max(1, contentWidth - 12);
  const rootsPreview =
    roots.length > 0
      ? roots
          .slice(0, 2)
          .map((root) => truncatePath(root, Math.max(18, Math.floor(contentWidth / 2))))
          .join(' | ')
      : 'No scan roots loaded yet.';
  const aboutBlocks = denseLayout
    ? [
        {
          key: 'about',
          label: 'About summary',
          node: (
            <Panel title="About OpenPkg" compact>
              <Text color={theme.primary}>{versionLine}</Text>
              <Text color={theme.text}>
                {truncateText(APP_DESCRIPTION, Math.max(24, contentWidth - 8))}
              </Text>
              <Text color={theme.muted}>
                Release {APP_LATEST_RELEASE} | {APP_ROADMAP_STATUS}
              </Text>
              <Text color={theme.muted}>Scope {currentScope} | Node {environmentNode}</Text>
            </Panel>
          )
        },
        {
          key: 'details',
          label: 'Details',
          node: (
            <Panel title="Details" compact>
              <Text color={theme.text}>
                Repo: {truncateText(APP_REPOSITORY_URL, Math.max(18, contentWidth - 8))}
              </Text>
              <Text color={theme.text}>
                Home: {truncateText(APP_HOMEPAGE, Math.max(18, contentWidth - 8))}
              </Text>
              <Text color={theme.text}>
                Issues: {truncateText(APP_ISSUES_URL, Math.max(18, contentWidth - 8))}
              </Text>
              <Text color={theme.text}>
                Platform {environmentPlatform} | Projects {projectCount} | Cleanup {cleanupCount}
              </Text>
              <Text color={theme.muted}>{rootsPreview}</Text>
              <Text color={theme.muted}>Author: {APP_AUTHOR}</Text>
              <Text color={theme.muted}>Contributors: Open source collaborators</Text>
            </Panel>
          )
        }
      ]
    : [
        {
          key: 'about',
          label: 'About summary',
          node: (
            <Panel title="About OpenPkg" compact={denseLayout}>
              <Text color={theme.primary}>{versionLine}</Text>
              <Text color={theme.text}>{APP_DESCRIPTION}</Text>
              <Text color={theme.muted}>Latest release: {APP_LATEST_RELEASE}</Text>
              <Text color={theme.muted}>Roadmap status: {APP_ROADMAP_STATUS}</Text>
              <Text color={theme.muted}>Current scope: {currentScope}</Text>
              <Text color={theme.muted}>Refresh this panel with r after changes.</Text>
            </Panel>
          )
        },
        {
          key: 'links',
          label: 'Links and environment',
          node: (
            <Box gap={1} flexDirection={stackedPanels ? 'column' : 'row'}>
              <Panel title="Links" compact={denseLayout} {...(stackedPanels ? {} : { width: '58%' })}>
                <Text color={theme.text}>Repository</Text>
                <Text color={theme.muted}>{truncateText(APP_REPOSITORY_URL, linkWidth)}</Text>
                <Text color={theme.text}>Homepage</Text>
                <Text color={theme.muted}>{truncateText(APP_HOMEPAGE, linkWidth)}</Text>
                <Text color={theme.text}>Issues</Text>
                <Text color={theme.muted}>{truncateText(APP_ISSUES_URL, linkWidth)}</Text>
              </Panel>

              <Panel title="Environment" compact={denseLayout} {...(stackedPanels ? {} : { width: '42%' })}>
                <Text color={theme.text}>Node: {environmentNode}</Text>
                <Text color={theme.text}>Platform: {environmentPlatform}</Text>
                <Text color={theme.text}>Projects loaded: {projectCount}</Text>
                <Text color={theme.text}>Cleanup targets: {cleanupCount}</Text>
                <Text color={theme.text}>UI: Ink / React</Text>
                <Text color={theme.text}>Author: {APP_AUTHOR}</Text>
                <Text color={theme.muted}>{rootsPreview}</Text>
                <Text color={theme.text}>Contributors: Open source collaborators</Text>
                <Text color={theme.muted}>Runtime details come from the live process or doctor data.</Text>
              </Panel>
            </Box>
          )
        }
      ];
  const visibleBlocks = getWindowedRows(aboutBlocks, selectedBlockIndex, viewportSize);

  return (
    <Box flexDirection="column" gap={1}>
      {aboutBlocks.length > viewportSize ? (
        <Text color={isFocused ? theme.primary : theme.muted}>
          Info block {Math.min(aboutBlocks.length, selectedBlockIndex + 1)}/{aboutBlocks.length}:{' '}
          {aboutBlocks[Math.min(aboutBlocks.length - 1, selectedBlockIndex)]?.label}
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
