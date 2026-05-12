import { mkdtemp, mkdir, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { CleanupExecutorService } from './cleanup-executor.service.js';
import type { CleanupTargetRecord } from '../types/index.js';

const tempDirectories: string[] = [];

const createCleanupTarget = async (directoryName: CleanupTargetRecord['kind']) => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'openpkg-cleanup-'));
  tempDirectories.push(tempRoot);

  const targetPath = path.join(tempRoot, directoryName);
  await mkdir(targetPath, { recursive: true });
  await writeFile(path.join(targetPath, 'artifact.txt'), 'temporary artifact');

  return {
    id: `${directoryName}:${targetPath}`,
    kind: directoryName,
    path: targetPath,
    sizeInBytes: 128,
    recommendation: 'safe' as const
  };
};

afterEach(async () => {
  await Promise.all(
    tempDirectories
      .splice(0, tempDirectories.length)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe('CleanupExecutorService', () => {
  it('deletes supported cleanup directories', async () => {
    const service = new CleanupExecutorService();
    const target = await createCleanupTarget('node_modules');

    const result = await service.deleteTargets([target]);

    await expect(stat(target.path)).rejects.toThrow();
    expect(result.deleted).toHaveLength(1);
    expect(result.failed).toHaveLength(0);
    expect(result.reclaimedBytes).toBe(128);
    expect(result.summary).toMatchObject({
      requestedCount: 1,
      plannedCount: 1,
      deletedCount: 1,
      failedCount: 0,
      reclaimedBytes: 128,
      dryRun: false
    });
  });

  it('previews supported cleanup directories without deleting them', async () => {
    const service = new CleanupExecutorService();
    const target = await createCleanupTarget('node_modules');

    const result = await service.previewTargets([target]);

    await expect(stat(target.path)).resolves.toBeDefined();
    expect(result.dryRun).toBe(true);
    expect(result.planned).toHaveLength(1);
    expect(result.deleted).toHaveLength(0);
    expect(result.failed).toHaveLength(0);
    expect(result.reclaimedBytes).toBe(128);
    expect(result.summary).toMatchObject({
      requestedCount: 1,
      plannedCount: 1,
      deletedCount: 0,
      failedCount: 0,
      reclaimedBytes: 128,
      dryRun: true
    });
  });

  it('refuses to delete unexpected directories', async () => {
    const service = new CleanupExecutorService();
    const target = await createCleanupTarget('build');
    const unsafeTarget: CleanupTargetRecord = {
      ...target,
      id: `unsafe:${path.dirname(target.path)}`,
      kind: 'build',
      path: path.dirname(target.path)
    };

    const result = await service.deleteTargets([unsafeTarget]);

    expect(result.deleted).toHaveLength(0);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]?.reason).toContain('unexpected directory');
    await expect(stat(target.path)).resolves.toBeDefined();
  });

  it('refuses deleting filesystem root', async () => {
    const service = new CleanupExecutorService();
    const rootPath = path.parse(process.cwd()).root;
    const target: CleanupTargetRecord = {
      id: `build:${rootPath}`,
      kind: 'build',
      path: rootPath,
      sizeInBytes: 0,
      recommendation: 'safe'
    };

    const result = await service.deleteTargets([target]);

    expect(result.deleted).toHaveLength(0);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]?.reason).toContain('filesystem root');
  });

  it('refuses target kind mismatch', async () => {
    const service = new CleanupExecutorService();
    const target = await createCleanupTarget('node_modules');
    const mismatched: CleanupTargetRecord = {
      ...target,
      kind: 'build'
    };

    const result = await service.deleteTargets([mismatched]);

    expect(result.deleted).toHaveLength(0);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]?.reason).toContain('Target kind mismatch');
    await expect(stat(target.path)).resolves.toBeDefined();
  });

  it('fails when target path is not a directory', async () => {
    const service = new CleanupExecutorService();
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'openpkg-cleanup-'));
    tempDirectories.push(tempRoot);
    const fileTargetPath = path.join(tempRoot, 'build');
    await writeFile(fileTargetPath, 'not a directory');

    const target: CleanupTargetRecord = {
      id: `build:${fileTargetPath}`,
      kind: 'build',
      path: fileTargetPath,
      sizeInBytes: 1,
      recommendation: 'review'
    };

    const result = await service.deleteTargets([target]);

    expect(result.deleted).toHaveLength(0);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]?.reason).toContain('not a directory');
  });

  it('reports per-target progress for previews and deletions', async () => {
    const service = new CleanupExecutorService();
    const previewTarget = await createCleanupTarget('dist');
    const deleteTarget = await createCleanupTarget('build');
    const previewPhases: string[] = [];
    const deletePhases: string[] = [];

    await service.previewTargets([previewTarget], {
      onProgress: (progress) => {
        previewPhases.push(progress.phase);
      }
    });

    await service.deleteTargets([deleteTarget], {
      onProgress: (progress) => {
        deletePhases.push(progress.phase);
      }
    });

    expect(previewPhases).toEqual(['validating', 'done']);
    expect(deletePhases).toEqual(['deleting', 'done']);
  });
});
