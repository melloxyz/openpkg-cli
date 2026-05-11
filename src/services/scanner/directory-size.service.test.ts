import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { DirectorySizeService } from './directory-size.service.js';

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0, tempDirectories.length).map((directory) =>
      rm(directory, { recursive: true, force: true })
    )
  );
});

describe('DirectorySizeService', () => {
  it('calculates directory size with real file sizes', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'openpgk-size-'));
    tempDirectories.push(root);

    const nested = path.join(root, 'nested');
    await mkdir(nested, { recursive: true });
    await writeFile(path.join(root, 'a.txt'), '12345');
    await writeFile(path.join(nested, 'b.txt'), '1234567890');

    const service = new DirectorySizeService();
    const size = await service.getDirectorySize(root);

    expect(size).toBeGreaterThanOrEqual(15);
  });
});
