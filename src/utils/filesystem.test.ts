import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDefaultProjectRoots, getMachineScanRoots, pathExists } from './filesystem.js';

const tempDirectories: string[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(
    tempDirectories
      .splice(0, tempDirectories.length)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe('filesystem utils', () => {
  it('pathExists returns true for existing path and false otherwise', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'openpkg-fs-'));
    tempDirectories.push(root);
    const filePath = path.join(root, 'file.txt');
    await writeFile(filePath, 'ok');

    await expect(pathExists(filePath)).resolves.toBe(true);
    await expect(pathExists(path.join(root, 'missing.txt'))).resolves.toBe(false);
  });

  it('getMachineScanRoots returns mocked home when available', async () => {
    const home = await mkdtemp(path.join(os.tmpdir(), 'openpkg-home-'));
    tempDirectories.push(home);
    vi.spyOn(os, 'homedir').mockReturnValue(home);

    await expect(getMachineScanRoots()).resolves.toEqual([home]);
  });

  it('getMachineScanRoots returns empty when home does not exist', async () => {
    const missingHome = path.join(os.tmpdir(), 'openpkg-home-missing');
    vi.spyOn(os, 'homedir').mockReturnValue(missingHome);

    await expect(getMachineScanRoots()).resolves.toEqual([]);
  });

  it('getDefaultProjectRoots keeps cwd, filters parent roots and preserves existing candidates', async () => {
    const home = await mkdtemp(path.join(os.tmpdir(), 'openpkg-home-'));
    tempDirectories.push(home);
    const desktop = path.join(home, 'Desktop');
    const projects = path.join(home, 'Projects');
    const code = path.join(home, 'Code');
    const cwd = path.join(desktop, 'my-app');
    await Promise.all([
      mkdir(cwd, { recursive: true }),
      mkdir(projects, { recursive: true }),
      mkdir(code, { recursive: true })
    ]);

    vi.spyOn(os, 'homedir').mockReturnValue(home);

    const roots = await getDefaultProjectRoots(cwd);

    expect(roots).toContain(cwd);
    expect(roots).toContain(projects);
    expect(roots).toContain(code);
    expect(roots).not.toContain(desktop);
  });
});
