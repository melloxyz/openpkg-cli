import type { CleanupTargetRecord } from '../types/index.js';

export type CleanupFilterMode = 'all' | CleanupTargetRecord['recommendation'];
export type CleanupSortMode = 'largest' | 'recent' | 'kind';

const compareStrings = (left: string, right: string) => left.localeCompare(right);

export const filterCleanupTargets = (targets: CleanupTargetRecord[], filter: CleanupFilterMode) =>
  filter === 'all' ? targets : targets.filter((target) => target.recommendation === filter);

export const sortCleanupTargets = (targets: CleanupTargetRecord[], sortMode: CleanupSortMode) => {
  const records = [...targets];

  records.sort((left, right) => {
    if (sortMode === 'largest') {
      const bySize = (right.sizeInBytes ?? 0) - (left.sizeInBytes ?? 0);
      if (bySize !== 0) {
        return bySize;
      }
    }

    if (sortMode === 'kind') {
      const byKind = compareStrings(left.kind, right.kind);
      if (byKind !== 0) {
        return byKind;
      }
    }

    const byModified = compareStrings(right.lastModifiedAt ?? '', left.lastModifiedAt ?? '');
    if (byModified !== 0) {
      return byModified;
    }

    const byPath = compareStrings(left.path, right.path);
    if (byPath !== 0) {
      return byPath;
    }

    return compareStrings(left.kind, right.kind);
  });

  return records;
};

export const getVisibleCleanupTargets = (
  targets: CleanupTargetRecord[],
  filter: CleanupFilterMode,
  sortMode: CleanupSortMode
) => sortCleanupTargets(filterCleanupTargets(targets, filter), sortMode);
