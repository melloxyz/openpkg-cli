import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../shared/theme.js';
import type { CleanupTargetRecord } from '../../types/index.js';
import { formatBytes, formatRelativeDate } from '../../utils/format.js';
import { Panel } from '../components/Panel.js';

type CleanupScreenProps = {
  cleanupTargets: CleanupTargetRecord[];
  title?: string;
  selectedIndex: number;
  selectedIds: Set<string>;
  isFocused: boolean;
  pendingDeletionCount: number;
};

const truncate = (value: string, length: number) =>
  value.length > length ? `${value.slice(0, length - 1)}…` : value;

const getWindowedRows = <TValue,>(values: TValue[], selectedIndex: number, size: number) => {
  if (values.length <= size) {
    return values.map((value, index) => ({ value, index }));
  }

  const half = Math.floor(size / 2);
  const start = Math.max(0, Math.min(selectedIndex - half, values.length - size));
  return values.slice(start, start + size).map((value, index) => ({
    value,
    index: start + index
  }));
};

export const CleanupScreen = ({
  cleanupTargets,
  title = 'Cleanup Candidates',
  selectedIndex,
  selectedIds,
  isFocused,
  pendingDeletionCount
}: CleanupScreenProps) => {
  const selectedTarget = cleanupTargets[selectedIndex];
  const visibleRows = getWindowedRows(cleanupTargets, selectedIndex, 10);
  const safeCount = cleanupTargets.filter((record) => record.recommendation === 'safe').length;
  const selectedCount = cleanupTargets.filter((record) => selectedIds.has(record.id)).length;

  return (
    <Box gap={1}>
      <Panel
        title={`${title} (${cleanupTargets.length})`}
        width="60%"
        footer={
          isFocused
            ? 'Focused: j/k move, space select, a select safe, c clear, x delete, r refresh.'
            : 'Tab into content to manage cleanup targets.'
        }
      >
        {cleanupTargets.length === 0 ? (
          <Text color={theme.muted}>Run /cleanup or /cache to populate cleanup candidates.</Text>
        ) : (
          <Box flexDirection="column">
            <Text color={theme.muted}>Sel Kind         Recommendation Size      Modified   Path</Text>
            {visibleRows.map(({ value: record, index }) => {
              const isActive = index === selectedIndex;
              const isSelected = selectedIds.has(record.id);
              const tone =
                record.recommendation === 'safe'
                  ? theme.success
                  : record.recommendation === 'active'
                    ? theme.warning
                    : theme.text;

              return (
                <Text key={record.id} color={isActive ? theme.accent : theme.text}>
                  {isActive ? '›' : ' '} {isSelected ? '[x]' : '[ ]'} {record.kind.padEnd(12)}{' '}
                  <Text color={tone}>{record.recommendation.padEnd(14)}</Text>{' '}
                  {formatBytes(record.sizeInBytes).padEnd(9)}{' '}
                  {formatRelativeDate(record.lastModifiedAt).padEnd(10)}{' '}
                  {truncate(record.path, 28)}
                </Text>
              );
            })}
          </Box>
        )}
      </Panel>
      <Panel
        title="Deletion Review"
        width="40%"
        footer={
          pendingDeletionCount > 0
            ? `Deletion armed for ${pendingDeletionCount} target(s). Press y to confirm or Esc to cancel.`
            : `${safeCount} safe candidate(s). ${selectedCount} currently selected.`
        }
      >
        {selectedTarget ? (
          <Box flexDirection="column">
            <Text color={theme.primary}>{selectedTarget.kind}</Text>
            <Text color={theme.text}>Recommendation: {selectedTarget.recommendation}</Text>
            <Text color={theme.text}>Estimated Size: {formatBytes(selectedTarget.sizeInBytes)}</Text>
            <Text color={theme.text}>Last Modified: {formatRelativeDate(selectedTarget.lastModifiedAt)}</Text>
            <Text color={theme.muted}>Path</Text>
            <Text color={theme.text}>{selectedTarget.path}</Text>
          </Box>
        ) : (
          <Text color={theme.muted}>Select a cleanup target to inspect risk and path details.</Text>
        )}
      </Panel>
    </Box>
  );
};
