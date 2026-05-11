import { mkdtemp, mkdir, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { CleanupExecutorService } from './cleanup-executor.service.js';
import type { CleanupTargetRecord } from '../types/index.js';

const tempDirectories: string[] = [];

const createCleanupTarget = async (directoryName: CleanupTargetRecord['kind']) => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'openpgk-cleanup-'));
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
    tempDirectories.splice(0, tempDirectories.length).map((directory) =>
      rm(directory, { recursive: true, force: true })
    )
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
});
