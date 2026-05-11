import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathExists } from '../utils/filesystem.js';
import type { PackageManager } from '../types/index.js';
import type { ProjectManifest } from '../shared/schemas/project-manifest.schema.js';

const LOCKFILE_MATRIX: Array<{ filename: string; packageManager: PackageManager }> = [
  { filename: 'pnpm-lock.yaml', packageManager: 'pnpm' },
  { filename: 'bun.lockb', packageManager: 'bun' },
  { filename: 'bun.lock', packageManager: 'bun' },
  { filename: 'yarn.lock', packageManager: 'yarn' },
  { filename: 'package-lock.json', packageManager: 'npm' }
];

const PACKAGE_MANAGER_PREFIXES: Array<{
  prefix: string;
  packageManager: PackageManager;
}> = [
  { prefix: 'pnpm@', packageManager: 'pnpm' },
  { prefix: 'npm@', packageManager: 'npm' },
  { prefix: 'yarn@', packageManager: 'yarn' },
  { prefix: 'bun@', packageManager: 'bun' },
  { prefix: 'poetry@', packageManager: 'poetry' },
  { prefix: 'uv@', packageManager: 'uv' }
];

const resolvePackageManagerFromManifest = (manifest?: ProjectManifest): PackageManager | undefined => {
  const packageManagerValue = manifest?.packageManager?.trim().toLowerCase();

  if (!packageManagerValue) {
    return undefined;
  }

  for (const entry of PACKAGE_MANAGER_PREFIXES) {
    if (packageManagerValue.startsWith(entry.prefix)) {
      return entry.packageManager;
    }
  }

  if (packageManagerValue === 'npm') {
    return 'npm';
  }

  if (packageManagerValue === 'pnpm') {
    return 'pnpm';
  }

  if (packageManagerValue === 'yarn') {
    return 'yarn';
  }

  if (packageManagerValue === 'bun') {
    return 'bun';
  }

  return undefined;
};

const readTextFile = async (targetPath: string) => {
  try {
    return await fs.readFile(targetPath, 'utf8');
  } catch {
    return undefined;
  }
};

export class PackageManagerDetectorService {
  async detect(projectPath: string, manifest?: ProjectManifest): Promise<PackageManager> {
    for (const entry of LOCKFILE_MATRIX) {
      if (await pathExists(path.join(projectPath, entry.filename))) {
        return entry.packageManager;
      }
    }

    const fromManifest = resolvePackageManagerFromManifest(manifest);
    if (fromManifest) {
      return fromManifest;
    }

    const pyprojectContent = await readTextFile(path.join(projectPath, 'pyproject.toml'));

    if (pyprojectContent?.includes('[tool.poetry]')) {
      return 'poetry';
    }

    if (pyprojectContent?.includes('[tool.uv]')) {
      return 'uv';
    }

    if (await pathExists(path.join(projectPath, 'requirements.txt'))) {
      return 'pip';
    }

    return 'unknown';
  }
}
