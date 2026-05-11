import React from 'react';
import { Panel } from '../components/Panel.js';
import { Table } from '../components/Table.js';
import { formatBytes, formatRelativeDate } from '../../utils/format.js';
import type { CleanupTargetRecord } from '../../types/index.js';

type CleanupScreenProps = {
  cleanupTargets: CleanupTargetRecord[];
  title?: string;
};

export const CleanupScreen = ({
  cleanupTargets,
  title = 'Cleanup Candidates'
}: CleanupScreenProps) => (
  <Panel
    title={title}
    footer="Safe deletion flow can be layered on top of these records in the next iteration."
  >
    <Table
      headers={['Kind', 'Recommendation', 'Size', 'Modified', 'Path']}
      rows={cleanupTargets
        .slice(0, 10)
        .map((record) => [
          record.kind.padEnd(12),
          record.recommendation.padEnd(14),
          formatBytes(record.sizeInBytes).padEnd(8),
          formatRelativeDate(record.lastModifiedAt).padEnd(10),
          record.path.slice(-42)
        ])}
    />
  </Panel>
);
