import { promises as fs } from 'node:fs';
import path from 'node:path';
import type {
  CleanupExecutionOptions,
  CleanupExecutionResult,
  CleanupTargetRecord
} from '../types/index.js';

const ALLOWED_DIRECTORY_NAMES = new Set([
  'node_modules',
  '.pnpm-store',
  '.npm',
  '.turbo',
  '.next',
  'dist',
  'build'
]);

const validateCleanupTarget = async (target: CleanupTargetRecord): Promise<string | undefined> => {
  const resolvedPath = path.resolve(target.path);
  const parsedPath = path.parse(resolvedPath);
  const basename = path.basename(resolvedPath);

  if (resolvedPath === parsedPath.root) {
    return 'Refusing to delete a filesystem root.';
  }

  if (!ALLOWED_DIRECTORY_NAMES.has(basename)) {
    return `Refusing to delete unexpected directory: ${basename}.`;
  }

  if (basename !== target.kind) {
    return `Target kind mismatch for ${resolvedPath}.`;
  }

  const stats = await fs.stat(resolvedPath).catch(() => undefined);
  if (!stats?.isDirectory()) {
    return 'Target no longer exists or is not a directory.';
  }

  return undefined;
};

export class CleanupExecutorService {
  async previewTargets(
    targets: CleanupTargetRecord[],
    options: CleanupExecutionOptions = {}
  ): Promise<CleanupExecutionResult> {
    const planned: CleanupTargetRecord[] = [];
    const failed: CleanupExecutionResult['failed'] = [];
    let reclaimedBytes = 0;

    for (const [index, target] of targets.entries()) {
      options.onProgress?.({
        currentPath: target.path,
        current: index + 1,
        total: Math.max(1, targets.length),
        phase: 'validating'
      });
      const validationError = await validateCleanupTarget(target);

      if (validationError) {
        failed.push({
          target,
          reason: validationError
        });
        continue;
      }

      planned.push(target);
      reclaimedBytes += target.sizeInBytes ?? 0;
    }

    options.onProgress?.({
      current: targets.length,
      total: Math.max(1, targets.length),
      phase: 'done'
    });

    return {
      deleted: [],
      planned,
      failed,
      reclaimedBytes,
      dryRun: true,
      summary: {
        requestedCount: targets.length,
        plannedCount: planned.length,
        deletedCount: 0,
        failedCount: failed.length,
        reclaimedBytes,
        dryRun: true
      }
    };
  }

  async deleteTargets(
    targets: CleanupTargetRecord[],
    options: CleanupExecutionOptions = {}
  ): Promise<CleanupExecutionResult> {
    const deleted: CleanupTargetRecord[] = [];
    const failed: CleanupExecutionResult['failed'] = [];
    let reclaimedBytes = 0;

    for (const [index, target] of targets.entries()) {
      options.onProgress?.({
        currentPath: target.path,
        current: index + 1,
        total: Math.max(1, targets.length),
        phase: 'deleting'
      });
      const validationError = await validateCleanupTarget(target);

      if (validationError) {
        failed.push({
          target,
          reason: validationError
        });
        continue;
      }

      try {
        await fs.rm(target.path, {
          recursive: true,
          force: true,
          maxRetries: 2
        });

        deleted.push(target);
        reclaimedBytes += target.sizeInBytes ?? 0;
      } catch (error) {
        failed.push({
          target,
          reason: error instanceof Error ? error.message : 'Unknown deletion failure.'
        });
      }
    }

    options.onProgress?.({
      current: targets.length,
      total: Math.max(1, targets.length),
      phase: 'done'
    });

    return {
      deleted,
      failed,
      reclaimedBytes,
      summary: {
        requestedCount: targets.length,
        plannedCount: deleted.length,
        deletedCount: deleted.length,
        failedCount: failed.length,
        reclaimedBytes,
        dryRun: false
      }
    };
  }
}
