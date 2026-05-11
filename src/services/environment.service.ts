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

const getCommandVersion = async (
  command: string,
  args: string[],
  category: 'package-manager' | 'runtime' | 'container'
) => {
  try {
    const result = await execa(command, args, {
      reject: false,
      all: true
    });
    const version = result.all?.split(/\r?\n/).find(Boolean)?.trim();

    return {
      name: command,
      category,
      available: result.exitCode === 0,
      ...(version ? { version } : {})
    };
  } catch {
    return {
      name: command,
      category,
      available: false
    };
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

    const toolAvailability = await Promise.all([
      getCommandVersion('npm', ['--version'], 'package-manager'),
      getCommandVersion('pnpm', ['--version'], 'package-manager'),
      getCommandVersion('yarn', ['--version'], 'package-manager'),
      getCommandVersion('bun', ['--version'], 'package-manager'),
      getCommandVersion('python', ['--version'], 'runtime'),
      getCommandVersion('docker', ['--version'], 'container'),
      getCommandVersion('go', ['version'], 'runtime'),
      getCommandVersion('rustc', ['--version'], 'runtime'),
      getCommandVersion('java', ['-version'], 'runtime')
    ]);

    const toolVersions = Object.fromEntries(
      toolAvailability
        .filter((tool) => tool.version)
        .map((tool) => [tool.name, tool.version ?? ''])
    );

    const recommendations = [
      !pnpm ? 'Install pnpm to unlock the fastest package workflows.' : undefined,
      !bun ? 'Bun is missing. Future runtime and script support can surface here.' : undefined,
      !toolAvailability.some((tool) => tool.name === 'docker' && tool.available)
        ? 'Docker is missing. Container diagnostics will stay limited until it is installed.'
        : undefined,
      !toolAvailability.some((tool) => tool.name === 'python' && tool.available)
        ? 'Python is missing. Future polyglot environment management will be reduced.'
        : undefined
    ].filter((value): value is string => Boolean(value));

    return {
      nodeVersion: process.version,
      platform: os.platform(),
      packageManagers: { npm, pnpm, yarn, bun },
      toolVersions,
      toolAvailability,
      recommendations
    };
  }
}
