import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { PackageManagerDetectorService } from './package-manager-detector.service.js';

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0, tempDirectories.length).map((directory) =>
      rm(directory, { recursive: true, force: true })
    )
  );
});

describe('PackageManagerDetectorService', () => {
  it('detects package manager from package.json packageManager field without lockfile', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'openpgk-pm-'));
    tempDirectories.push(root);

    await writeFile(
      path.join(root, 'package.json'),
      JSON.stringify({
        name: 'detector-demo',
        packageManager: 'pnpm@9.0.0'
      })
    );

    const detector = new PackageManagerDetectorService();
    const result = await detector.detect(root, {
      name: 'detector-demo',
      packageManager: 'pnpm@9.0.0'
    });

    expect(result).toBe('pnpm');
  });
});
