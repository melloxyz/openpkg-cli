import path from 'node:path';
import { pathExists } from '../utils/filesystem.js';
import type { PackageManager } from '../types/index.js';

const LOCKFILE_MATRIX: Array<{ filename: string; packageManager: PackageManager }> = [
  { filename: 'pnpm-lock.yaml', packageManager: 'pnpm' },
  { filename: 'bun.lockb', packageManager: 'bun' },
  { filename: 'bun.lock', packageManager: 'bun' },
  { filename: 'yarn.lock', packageManager: 'yarn' },
  { filename: 'package-lock.json', packageManager: 'npm' }
];

export class PackageManagerDetectorService {
  async detect(projectPath: string): Promise<PackageManager> {
    for (const entry of LOCKFILE_MATRIX) {
      if (await pathExists(path.join(projectPath, entry.filename))) {
        return entry.packageManager;
      }
    }

    return 'unknown';
  }
}
