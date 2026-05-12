import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { DirectorySizeService } from './directory-size.service.js';

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories
      .splice(0, tempDirectories.length)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe('DirectorySizeService', () => {
  it('calculates directory size with real file sizes', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'openpkg-size-'));
    tempDirectories.push(root);

    const nested = path.join(root, 'nested');
    await mkdir(nested, { recursive: true });
    await writeFile(path.join(root, 'a.txt'), '12345');
    await writeFile(path.join(nested, 'b.txt'), '1234567890');

    const service = new DirectorySizeService();
    const size = await service.getDirectorySize(root);

    expect(size).toBeGreaterThanOrEqual(15);
  });

  it('returns zero for an empty directory', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'openpkg-size-'));
    tempDirectories.push(root);

    const service = new DirectorySizeService();
    const size = await service.getDirectorySize(root);

    expect(size).toBe(0);
  });

  it('returns zero for a missing directory path', async () => {
    const missingDirectory = path.join(os.tmpdir(), `openpkg-size-missing-${Date.now()}`);

    const service = new DirectorySizeService();
    const size = await service.getDirectorySize(missingDirectory);

    expect(size).toBe(0);
  });

  it('returns zero when the target path is a file instead of a directory', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'openpkg-size-'));
    tempDirectories.push(root);
    const targetFile = path.join(root, 'single-file.txt');
    await writeFile(targetFile, '123456');

    const service = new DirectorySizeService();
    const size = await service.getDirectorySize(targetFile);

    expect(size).toBe(0);
  });
});
