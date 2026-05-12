import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { PackageManagerDetectorService } from './package-manager-detector.service.js';

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories
      .splice(0, tempDirectories.length)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe('PackageManagerDetectorService', () => {
  it('prefers lockfile detection over packageManager in manifest', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'openpkg-pm-'));
    tempDirectories.push(root);

    await writeFile(
      path.join(root, 'package.json'),
      JSON.stringify({
        name: 'detector-demo',
        packageManager: 'npm@11.0.0'
      })
    );
    await writeFile(path.join(root, 'pnpm-lock.yaml'), 'lockfileVersion: 9');

    const detector = new PackageManagerDetectorService();
    const result = await detector.detect(root, {
      name: 'detector-demo',
      packageManager: 'npm@11.0.0'
    });

    expect(result).toBe('pnpm');
  });

  it('detects package manager from package.json packageManager field without lockfile', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'openpkg-pm-'));
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

  it('detects package manager from pyproject.toml and requirements fallback', async () => {
    const poetryRoot = await mkdtemp(path.join(os.tmpdir(), 'openpkg-pm-'));
    const uvRoot = await mkdtemp(path.join(os.tmpdir(), 'openpkg-pm-'));
    const pipRoot = await mkdtemp(path.join(os.tmpdir(), 'openpkg-pm-'));
    tempDirectories.push(poetryRoot, uvRoot, pipRoot);

    await writeFile(path.join(poetryRoot, 'pyproject.toml'), '[tool.poetry]\nname = "demo"');
    await writeFile(path.join(uvRoot, 'pyproject.toml'), '[tool.uv]\nmanaged = true');
    await writeFile(path.join(pipRoot, 'requirements.txt'), 'requests==2.32.3');

    const detector = new PackageManagerDetectorService();

    await expect(detector.detect(poetryRoot)).resolves.toBe('poetry');
    await expect(detector.detect(uvRoot)).resolves.toBe('uv');
    await expect(detector.detect(pipRoot)).resolves.toBe('pip');
  });

  it('returns unknown when no package-manager signals exist', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'openpkg-pm-'));
    tempDirectories.push(root);

    const detector = new PackageManagerDetectorService();
    const result = await detector.detect(root);

    expect(result).toBe('unknown');
  });
});
