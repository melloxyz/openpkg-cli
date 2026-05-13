import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../shared/theme.js';
import type { CleanupTargetRecord } from '../../types/index.js';
import { formatBytes, formatRelativeDate } from '../../utils/format.js';
import { getWindowedRows } from '../../utils/list-view.js';
import type { CleanupFilterMode, CleanupSortMode } from '../../utils/cleanup-view.js';
import { Panel } from '../components/Panel.js';

type CleanupScreenProps = {
  cleanupTargets: CleanupTargetRecord[];
  title?: string;
  selectedIndex: number;
  selectedIds: Set<string>;
  isFocused: boolean;
  pendingDeletionCount: number;
  compact: boolean;
  visibleRows: number;
  previewReclaimableBytes: number;
  totalSizeBytes: number;
  viewMode: 'split' | 'list' | 'detail';
  filterMode: CleanupFilterMode;
  sortMode: CleanupSortMode;
};

const truncate = (value: string, length: number) =>
  value.length > length ? `${value.slice(0, length - 1)}…` : value;

export const CleanupScreen = ({
  cleanupTargets,
  title = 'Cleanup Candidates',
  selectedIndex,
  selectedIds,
  isFocused,
  pendingDeletionCount,
  compact,
  visibleRows,
  previewReclaimableBytes,
  totalSizeBytes,
  viewMode,
  filterMode,
  sortMode
}: CleanupScreenProps) => {
  const selectedTarget = cleanupTargets[selectedIndex];
  const rows = getWindowedRows(cleanupTargets, selectedIndex, visibleRows);
  const safeCount = cleanupTargets.filter((record) => record.recommendation === 'safe').length;
  const selectedCount = cleanupTargets.filter((record) => selectedIds.has(record.id)).length;
  const pageSize = Math.max(1, visibleRows);
  const pageCount = Math.max(1, Math.ceil(Math.max(1, cleanupTargets.length) / pageSize));
  const pageNumber = Math.min(pageCount, Math.floor(Math.max(0, selectedIndex) / pageSize) + 1);
  const statusSummary = `${filterMode === 'all' ? 'all risk' : filterMode} • ${sortMode}`;
  const listFooter = isFocused
    ? 'j/k move, PgUp/PgDn page, f filter, o sort, space toggle, a safe, s all, c clear, x delete.'
    : 'Tab into content to manage cleanup targets.';
  const detailFooter = compact
    ? 'Enter or Esc returns to the list. PgUp/PgDn keeps paging through the current selection.'
    : 'Use the current selection to inspect recommendation, size and path details.';

  const listPanel = (
    <Panel
      title={`${title} (${cleanupTargets.length}) · ${statusSummary}`}
      {...(viewMode === 'detail' && compact ? { flexGrow: 1 } : compact ? {} : { width: '60%' })}
      flexGrow={1}
      footer={`${listFooter} Page ${pageNumber}/${pageCount}.`}
    >
      {cleanupTargets.length === 0 ? (
        <Text color={theme.muted}>Run /cleanup or /cache to populate cleanup candidates.</Text>
      ) : (
        <Box flexDirection="column">
          <Text color={theme.muted}>
            {compact
              ? 'Sel Kind         Size      Modified   Path'
              : 'Sel Kind         Recommendation Size      Modified   Path'}
          </Text>
          {rows.map(({ value: record, index }) => {
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
                {compact ? (
                  <>
                    {isActive ? '›' : ' '} {isSelected ? '[x]' : '[ ]'} {record.kind.padEnd(12)}{' '}
                    {formatBytes(record.sizeInBytes).padEnd(9)}{' '}
                    {formatRelativeDate(record.lastModifiedAt).padEnd(10)}{' '}
                    {truncate(record.path, 20)}
                  </>
                ) : (
                  <>
                    {isActive ? '›' : ' '} {isSelected ? '[x]' : '[ ]'} {record.kind.padEnd(12)}{' '}
                    <Text color={tone}>{record.recommendation.padEnd(14)}</Text>{' '}
                    {formatBytes(record.sizeInBytes).padEnd(9)}{' '}
                    {formatRelativeDate(record.lastModifiedAt).padEnd(10)}{' '}
                    {truncate(record.path, 28)}
                  </>
                )}
              </Text>
            );
          })}
        </Box>
      )}
    </Panel>
  );

  const detailPanel = (
    <Panel
      title="Deletion Review"
      {...(viewMode === 'list' && compact ? { flexGrow: 1 } : compact ? {} : { width: '40%' })}
      flexGrow={1}
      footer={
        pendingDeletionCount > 0
          ? `Deletion armed for ${pendingDeletionCount} target(s). Preview: ${formatBytes(previewReclaimableBytes)}. Press y to confirm or Esc to cancel.`
          : selectedTarget
            ? detailFooter
            : `${safeCount} safe candidate(s). ${selectedCount} selected. Total: ${formatBytes(totalSizeBytes)}. Preview: ${formatBytes(previewReclaimableBytes)}`
      }
    >
      {selectedTarget ? (
        <Box flexDirection="column">
          <Text color={theme.primary}>{selectedTarget.kind}</Text>
          <Text color={theme.text}>Recommendation: {selectedTarget.recommendation}</Text>
          <Text color={theme.text}>Estimated Size: {formatBytes(selectedTarget.sizeInBytes)}</Text>
          <Text color={theme.text}>
            Last Modified: {formatRelativeDate(selectedTarget.lastModifiedAt)}
          </Text>
          <Text color={theme.muted}>Path</Text>
          <Text color={theme.text}>{selectedTarget.path}</Text>
        </Box>
      ) : (
        <Text color={theme.muted}>Select a cleanup target to inspect risk and path details.</Text>
      )}
    </Panel>
  );

  if (viewMode === 'list') {
    return <Box>{listPanel}</Box>;
  }

  if (viewMode === 'detail') {
    return <Box>{detailPanel}</Box>;
  }

  return (
    <Box gap={1} flexDirection={compact ? 'column' : 'row'}>
      {listPanel}
      {detailPanel}
    </Box>
  );
};
