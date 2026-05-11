import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const pathExists = async (targetPath: string): Promise<boolean> => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

export const getDefaultProjectRoots = async (cwd: string): Promise<string[]> => {
  const homeDir = os.homedir();
  const candidates = [
    cwd,
    path.join(homeDir, 'Desktop'),
    path.join(homeDir, 'Projects'),
    path.join(homeDir, 'Code'),
    path.join(homeDir, 'dev'),
    path.join(homeDir, 'Developer')
  ];

  const available = await Promise.all(
    candidates.map(async (candidate) => ((await pathExists(candidate)) ? candidate : undefined))
  );

  const unique = [...new Set(available.filter((value): value is string => Boolean(value)))];

  return unique.filter((candidate, index) => {
    if (candidate === cwd) {
      return true;
    }

    return !unique.some((otherCandidate, otherIndex) => {
      if (otherIndex === index || otherCandidate !== cwd) {
        return false;
      }

      return cwd.startsWith(`${candidate}${path.sep}`);
    });
  });
};

export const getMachineScanRoots = async (): Promise<string[]> => {
  const homeDir = os.homedir();
  return (await pathExists(homeDir)) ? [homeDir] : [];
};
