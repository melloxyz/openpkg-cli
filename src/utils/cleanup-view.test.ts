import { describe, expect, it } from 'vitest';
import type { CleanupTargetRecord } from '../types/index.js';
import {
  filterCleanupTargets,
  getVisibleCleanupTargets,
  sortCleanupTargets
} from './cleanup-view.js';

const cleanupTargets: CleanupTargetRecord[] = [
  {
    id: 'large',
    kind: 'dist',
    path: '/large',
    sizeInBytes: 500,
    lastModifiedAt: '2026-01-01T00:00:00.000Z',
    recommendation: 'safe'
  },
  {
    id: 'recent',
    kind: 'build',
    path: '/recent',
    sizeInBytes: 100,
    lastModifiedAt: '2026-02-01T00:00:00.000Z',
    recommendation: 'active'
  },
  {
    id: 'review',
    kind: '.npm',
    path: '/review',
    sizeInBytes: 250,
    recommendation: 'review'
  }
];

describe('cleanup-view helpers', () => {
  it('filters cleanup targets by recommendation', () => {
    expect(filterCleanupTargets(cleanupTargets, 'safe')).toEqual([cleanupTargets[0]]);
    expect(filterCleanupTargets(cleanupTargets, 'all')).toEqual(cleanupTargets);
  });

  it('sorts cleanup targets by size, recency and kind', () => {
    expect(sortCleanupTargets(cleanupTargets, 'largest').map((target) => target.id)).toEqual([
      'large',
      'review',
      'recent'
    ]);

    expect(sortCleanupTargets(cleanupTargets, 'recent').map((target) => target.id)).toEqual([
      'recent',
      'large',
      'review'
    ]);

    expect(sortCleanupTargets(cleanupTargets, 'kind').map((target) => target.id)).toEqual([
      'review',
      'recent',
      'large'
    ]);
  });

  it('chains filtering and sorting for the visible cleanup list', () => {
    expect(getVisibleCleanupTargets(cleanupTargets, 'safe', 'largest')).toEqual([
      cleanupTargets[0]
    ]);
  });
});
