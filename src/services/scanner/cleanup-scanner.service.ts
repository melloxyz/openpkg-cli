import { promises as fs } from 'node:fs';
import os from 'node:os';
import fastGlob from 'fast-glob';
import path from 'node:path';
import { CLEANUP_TARGET_PATTERNS, DEFAULT_SCAN_EXCLUDES } from '../../shared/constants.js';
import { DirectorySizeService } from './directory-size.service.js';
import type {
  CleanupTargetKind,
  CleanupTargetRecord,
  ScanOptions,
  ScanSummary
} from '../../types/index.js';
import { mapWithConcurrency } from '../../utils/async.js';

const inferRecommendation = (kind: CleanupTargetKind, lastModifiedAt?: string) => {
  if (!lastModifiedAt) {
    return 'review' as const;
  }

  const days = (Date.now() - new Date(lastModifiedAt).getTime()) / 86_400_000;
  if (kind === 'node_modules') {
    if (days < 14) {
      return 'active' as const;
    }

    if (days > 60) {
      return 'safe' as const;
    }

    return 'review' as const;
  }

  if (kind === '.npm' || kind === '.pnpm-store') {
    if (days < 7) {
      return 'active' as const;
    }

    if (days > 45) {
      return 'safe' as const;
    }

    return 'review' as const;
  }

  if (days < 3) {
    return 'active' as const;
  }

  if (days > 21) {
    return 'safe' as const;
  }

  return 'review' as const;
};

const cleanupScanExcludes = DEFAULT_SCAN_EXCLUDES.filter(
  (pattern) => pattern !== '**/node_modules/**'
);

export class CleanupScannerService {
  readonly #sizeService = new DirectorySizeService();

  async scan(roots: string[], options: ScanOptions = {}): Promise<ScanSummary<CleanupTargetRecord>> {
    const startedAt = new Date().toISOString();
    const allMatches: string[] = [];

    for (const [index, root] of roots.entries()) {
      const discoveredPaths = await fastGlob(Object.values(CLEANUP_TARGET_PATTERNS).flat(), {
        cwd: root,
        absolute: true,
        onlyDirectories: true,
        unique: true,
        suppressErrors: true,
        followSymbolicLinks: false,
        throwErrorOnBrokenSymbolicLink: false,
        ignore: cleanupScanExcludes
      });

      allMatches.push(...discoveredPaths);
      options.onProgress?.({
        currentPath: root,
        visited: index + 1,
        matched: allMatches.length,
        total: Math.max(1, roots.length),
        phase: 'discovering'
      });
    }

    const uniqueMatches = [...new Set(allMatches)];
    let processedTargets = 0;
    const results = await mapWithConcurrency(
      uniqueMatches,
      Math.min(6, Math.max(2, os.cpus().length)),
      async (match) => {
        const kind = path.basename(match) as CleanupTargetKind;
        const stats = await fs.stat(match).catch(() => undefined);
        const sizeInBytes = await this.#sizeService.getDirectorySize(match).catch(() => 0);
        const lastModifiedAt = stats?.mtime.toISOString();

        return {
          id: `${kind}:${match}`,
          kind,
          path: match,
          sizeInBytes,
          ...(lastModifiedAt ? { lastModifiedAt } : {}),
          recommendation: inferRecommendation(kind, lastModifiedAt)
        } satisfies CleanupTargetRecord;
      },
      {
        onResolved: async (record) => {
          processedTargets += 1;
          options.onProgress?.({
            currentPath: record.path,
            visited: processedTargets,
            matched: processedTargets,
            total: Math.max(1, uniqueMatches.length),
            phase: 'sizing'
          });
        }
      }
    );

    const completedAt = new Date().toISOString();
    options.onProgress?.({
      visited: results.length,
      matched: results.length,
      total: Math.max(1, results.length),
      phase: 'done'
    });

    return {
      roots,
      startedAt,
      completedAt,
      durationMs: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
      records: results.sort((left, right) => (right.sizeInBytes ?? 0) - (left.sizeInBytes ?? 0))
    };
  }
}
