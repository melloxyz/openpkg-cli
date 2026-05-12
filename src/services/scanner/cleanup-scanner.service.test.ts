import { mkdtemp, mkdir, rm, utimes, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { CleanupScannerService } from './cleanup-scanner.service.js';

const tempDirectories: string[] = [];

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);

const createCleanupDirectory = async (
  root: string,
  relativePath: string,
  fileSize: number,
  modifiedDaysAgo: number
) => {
  const directoryPath = path.join(root, relativePath);
  await mkdir(directoryPath, { recursive: true });
  await writeFile(path.join(directoryPath, 'artifact.bin'), 'x'.repeat(fileSize));
  const modifiedAt = daysAgo(modifiedDaysAgo);
  await utimes(directoryPath, modifiedAt, modifiedAt);
  return directoryPath;
};

afterEach(async () => {
  await Promise.all(
    tempDirectories
      .splice(0, tempDirectories.length)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe('CleanupScannerService', () => {
  it('discovers cleanup targets and assigns recommendations', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'openpkg-cleanup-scan-'));
    tempDirectories.push(root);

    const nodeModulesPath = await createCleanupDirectory(root, 'workspace/node_modules', 120, 1);
    const distPath = await createCleanupDirectory(root, 'workspace/dist', 10, 45);
    const buildPath = await createCleanupDirectory(root, 'workspace/build', 50, 10);

    const scanner = new CleanupScannerService();
    const summary = await scanner.scan([root]);

    expect(summary.roots).toEqual([root]);
    expect(summary.records.length).toBeGreaterThanOrEqual(3);

    const nodeModules = summary.records.find((entry) => entry.kind === 'node_modules');
    const dist = summary.records.find((entry) => entry.kind === 'dist');
    const build = summary.records.find((entry) => entry.kind === 'build');

    expect(nodeModules?.recommendation).toBe('active');
    expect(dist?.recommendation).toBe('safe');
    expect(build?.recommendation).toBe('review');
    expect(nodeModules?.path.includes(path.basename(nodeModulesPath))).toBe(true);
    expect(dist?.path.includes(path.basename(distPath))).toBe(true);
    expect(build?.path.includes(path.basename(buildPath))).toBe(true);
  });

  it('sorts targets by size descending', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'openpkg-cleanup-scan-'));
    tempDirectories.push(root);

    await createCleanupDirectory(root, 'a/dist', 10, 40);
    await createCleanupDirectory(root, 'b/build', 200, 40);

    const scanner = new CleanupScannerService();
    const summary = await scanner.scan([root]);

    expect(summary.records[0]?.kind).toBe('build');
    expect((summary.records[0]?.sizeInBytes ?? 0) >= (summary.records[1]?.sizeInBytes ?? 0)).toBe(
      true
    );
  });
});
