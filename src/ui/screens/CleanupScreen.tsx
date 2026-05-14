import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../shared/theme.js';
import type { CleanupTargetRecord } from '../../types/index.js';
import { formatBytes, formatRelativeDate } from '../../utils/format.js';
import { getWindowedRows } from '../../utils/list-view.js';
import type { CleanupFilterMode, CleanupSortMode } from '../../utils/cleanup-view.js';
import { fitText, truncatePath, truncateText } from '../../utils/text-layout.js';
import { Panel } from '../components/Panel.js';

type CleanupScreenProps = {
  cleanupTargets: CleanupTargetRecord[];
  title?: string;
  selectedIndex: number;
  selectedIds: Set<string>;
  isFocused: boolean;
  pendingDeletionCount: number;
  compact: boolean;
  contentWidth: number;
  visibleRows: number;
  previewReclaimableBytes: number;
  totalSizeBytes: number;
  viewMode: 'split' | 'list' | 'detail';
  filterMode: CleanupFilterMode;
  sortMode: CleanupSortMode;
};

export const CleanupScreen = ({
  cleanupTargets,
  title = 'Cleanup',
  selectedIndex,
  selectedIds,
  isFocused,
  pendingDeletionCount,
  compact,
  contentWidth,
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
  const listWidth = compact || viewMode === 'list' ? contentWidth : Math.floor(contentWidth * 0.6);
  const detailWidth =
    compact || viewMode === 'detail' ? contentWidth : Math.floor(contentWidth * 0.4);
  const kindWidth = Math.max(4, Math.min(12, listWidth - 44));
  const pathWidth = compact ? Math.max(1, listWidth - 42) : Math.max(1, listWidth - 58);
  const listFooter = isFocused
    ? 'j/k move, Pg page, f/o tune, Space select, a safe, x delete, Esc sidebar.'
    : 'Tab into content to manage cleanup targets.';
  const detailFooter = compact
    ? 'Enter/Esc returns to list. Esc again returns to sidebar.'
    : 'Use the current selection to inspect recommendation, size and path details.';

  const listPanel = (
    <Panel
      title={`${title} ${cleanupTargets.length} · ${statusSummary}`}
      {...(viewMode === 'detail' && compact ? { flexGrow: 1 } : compact ? {} : { width: '60%' })}
      flexGrow={1}
      footer={truncateText(`${listFooter} Page ${pageNumber}/${pageCount}.`, Math.max(1, listWidth - 4))}
    >
      {cleanupTargets.length === 0 ? (
        <Text color={theme.muted}>Run /cleanup or /cache to populate cleanup candidates.</Text>
      ) : (
        <Box flexDirection="column">
          <Text color={theme.muted}>
            {compact
              ? `Sel ${fitText('Kind', kindWidth)} Size      Modified   Path`
              : `Sel ${fitText('Kind', kindWidth)} Recommendation Size      Modified   Path`}
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
              <Text key={record.id} color={isActive ? theme.primary : theme.text}>
                {compact ? (
                  <>
                    {isActive ? '›' : ' '} {isSelected ? '[x]' : '[ ]'}{' '}
                    {fitText(record.kind, kindWidth)} {fitText(formatBytes(record.sizeInBytes), 9)}{' '}
                    {fitText(formatRelativeDate(record.lastModifiedAt), 10)}{' '}
                    {truncatePath(record.path, pathWidth)}
                  </>
                ) : (
                  <>
                    {isActive ? '›' : ' '} {isSelected ? '[x]' : '[ ]'}{' '}
                    {fitText(record.kind, kindWidth)}{' '}
                    <Text color={tone}>{fitText(record.recommendation, 14)}</Text>{' '}
                    {fitText(formatBytes(record.sizeInBytes), 9)}{' '}
                    {fitText(formatRelativeDate(record.lastModifiedAt), 10)}{' '}
                    {truncatePath(record.path, pathWidth)}
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
          ? truncateText(
              `Deletion armed for ${pendingDeletionCount} target(s). Preview: ${formatBytes(previewReclaimableBytes)}. Press y to confirm or Esc to cancel.`,
              Math.max(1, detailWidth - 4)
            )
          : selectedTarget
            ? truncateText(detailFooter, Math.max(1, detailWidth - 4))
            : truncateText(
                `${safeCount} safe candidate(s). ${selectedCount} selected. Total: ${formatBytes(totalSizeBytes)}. Preview: ${formatBytes(previewReclaimableBytes)}`,
                Math.max(1, detailWidth - 4)
              )
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
          <Text color={theme.text}>
            {truncatePath(selectedTarget.path, Math.max(1, detailWidth - 4))}
          </Text>
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
