import { promises as fs } from 'node:fs';
import fastGlob from 'fast-glob';
import path from 'node:path';
import { CLEANUP_TARGET_PATTERNS, DEFAULT_SCAN_EXCLUDES } from '../../shared/constants.js';
import { DirectorySizeService } from './directory-size.service.js';
import type { CleanupTargetKind, CleanupTargetRecord, ScanSummary } from '../../types/index.js';

const inferRecommendation = (kind: CleanupTargetKind, lastModifiedAt?: string) => {
  if (!lastModifiedAt) {
    return 'review' as const;
  }

  const days = (Date.now() - new Date(lastModifiedAt).getTime()) / 86_400_000;
  if (kind === 'node_modules' && days < 7) {
    return 'active' as const;
  }

  if (days > 30) {
    return 'safe' as const;
  }

  return 'review' as const;
};

export class CleanupScannerService {
  readonly #sizeService = new DirectorySizeService();

  async scan(roots: string[]): Promise<ScanSummary<CleanupTargetRecord>> {
    const startedAt = new Date().toISOString();
    const results: CleanupTargetRecord[] = [];

    for (const root of roots) {
      const matches = await fastGlob(Object.values(CLEANUP_TARGET_PATTERNS).flat(), {
        cwd: root,
        absolute: true,
        onlyDirectories: true,
        unique: true,
        suppressErrors: true,
        ignore: DEFAULT_SCAN_EXCLUDES
      });

      for (const match of matches) {
        const kind = path.basename(match) as CleanupTargetKind;
        const stats = await fs.stat(match).catch(() => undefined);
        const sizeInBytes = await this.#sizeService.getDirectorySize(match).catch(() => 0);
        const lastModifiedAt = stats?.mtime.toISOString();

        results.push({
          id: `${kind}:${match}`,
          kind,
          path: match,
          sizeInBytes,
          ...(lastModifiedAt ? { lastModifiedAt } : {}),
          recommendation: inferRecommendation(kind, lastModifiedAt)
        });
      }
    }

    const completedAt = new Date().toISOString();

    return {
      roots,
      startedAt,
      completedAt,
      durationMs: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
      records: results.sort((left, right) => (right.sizeInBytes ?? 0) - (left.sizeInBytes ?? 0))
    };
  }
}
