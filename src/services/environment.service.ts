import os from 'node:os';
import { execa } from 'execa';
import type { EnvironmentHealthSnapshot, PackageManager } from '../types/index.js';

const isPackageManagerAvailable = async (command: Exclude<PackageManager, 'unknown'>) => {
  try {
    await execa(command, ['--version']);
    return true;
  } catch {
    return false;
  }
};

export class EnvironmentService {
  async getHealthSnapshot(): Promise<EnvironmentHealthSnapshot> {
    const [npm, pnpm, yarn, bun] = await Promise.all([
      isPackageManagerAvailable('npm'),
      isPackageManagerAvailable('pnpm'),
      isPackageManagerAvailable('yarn'),
      isPackageManagerAvailable('bun')
    ]);

    const recommendations = [
      !pnpm ? 'Install pnpm to unlock the fastest package workflows.' : undefined,
      !bun ? 'Bun is missing. Future runtime and script support can surface here.' : undefined
    ].filter((value): value is string => Boolean(value));

    return {
      nodeVersion: process.version,
      platform: os.platform(),
      packageManagers: { npm, pnpm, yarn, bun },
      recommendations
    };
  }
}
