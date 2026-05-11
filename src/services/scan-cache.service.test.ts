import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ScanCacheService } from './scan-cache.service.js';
import type {
  CleanupTargetRecord,
  EnvironmentHealthSnapshot,
  ProjectRecord,
  ScanSummary
} from '../types/index.js';

const tempDirectories: string[] = [];

const createProjectSummary = (roots: string[]): ScanSummary<ProjectRecord> => ({
  roots,
  startedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  completedAt: new Date('2026-01-01T00:00:01.000Z').toISOString(),
  durationMs: 1000,
  records: [
    {
      id: '/tmp/demo',
      name: 'demo',
      path: '/tmp/demo',
      framework: 'react',
      packageManager: 'pnpm',
      activityStatus: 'active'
    }
  ]
});

const createCleanupSummary = (roots: string[]): ScanSummary<CleanupTargetRecord> => ({
  roots,
  startedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  completedAt: new Date('2026-01-01T00:00:01.000Z').toISOString(),
  durationMs: 1000,
  records: [
    {
      id: 'dist:/tmp/demo/dist',
      kind: 'dist',
      path: '/tmp/demo/dist',
      recommendation: 'safe',
      sizeInBytes: 2048
    }
  ]
});

const createHealthSnapshot = (): EnvironmentHealthSnapshot => ({
  nodeVersion: 'v22.0.0',
  platform: process.platform,
  packageManagers: { npm: true, pnpm: true, yarn: false, bun: false },
  toolVersions: { npm: '11.0.0' },
  toolAvailability: [
    { name: 'npm', category: 'package-manager', available: true, version: '11.0.0' }
  ],
  recommendations: []
});

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(
    tempDirectories
      .splice(0, tempDirectories.length)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe('ScanCacheService', () => {
  it('stores and retrieves project summaries with normalized roots key', async () => {
    const home = await mkdtemp(path.join(os.tmpdir(), 'openpgk-cache-'));
    tempDirectories.push(home);
    vi.spyOn(os, 'homedir').mockReturnValue(home);
    const cache = new ScanCacheService();
    const summary = createProjectSummary(['C:\\workspace-b', 'C:\\workspace-a']);

    await cache.setProjectSummary(summary);

    await expect(cache.getProjectSummary(['C:\\workspace-a', 'C:\\workspace-b'])).resolves.toEqual(
      summary
    );
  });

  it('returns undefined for stale or root-mismatched project cache', async () => {
    const home = await mkdtemp(path.join(os.tmpdir(), 'openpgk-cache-'));
    tempDirectories.push(home);
    vi.spyOn(os, 'homedir').mockReturnValue(home);
    const cache = new ScanCacheService();
    const summary = createProjectSummary(['C:\\workspace']);

    await cache.setProjectSummary(summary);

    await expect(cache.getProjectSummary(['C:\\other-workspace'])).resolves.toBeUndefined();
    await expect(cache.getProjectSummary(['C:\\workspace'], -1)).resolves.toBeUndefined();
  });

  it('stores cleanup and health snapshots', async () => {
    const home = await mkdtemp(path.join(os.tmpdir(), 'openpgk-cache-'));
    tempDirectories.push(home);
    vi.spyOn(os, 'homedir').mockReturnValue(home);
    const cache = new ScanCacheService();
    const cleanup = createCleanupSummary(['C:\\workspace']);
    const health = createHealthSnapshot();

    await cache.setCleanupSummary(cleanup);
    await cache.setHealthSnapshot(health);

    await expect(cache.getCleanupSummary(['C:\\workspace'])).resolves.toEqual(cleanup);
    await expect(cache.getHealthSnapshot()).resolves.toEqual(health);
  });

  it('recovers from malformed cache file content', async () => {
    const home = await mkdtemp(path.join(os.tmpdir(), 'openpgk-cache-'));
    tempDirectories.push(home);
    vi.spyOn(os, 'homedir').mockReturnValue(home);
    const cacheFile = path.join(home, '.openpgk', 'cache.json');
    await mkdir(path.dirname(cacheFile), { recursive: true });
    await writeFile(cacheFile, '{not-valid-json', 'utf8');

    const cache = new ScanCacheService();
    await expect(cache.getProjectSummary(['C:\\workspace'])).resolves.toBeUndefined();

    await cache.setHealthSnapshot(createHealthSnapshot());
    const updated = await readFile(cacheFile, 'utf8');
    expect(() => {
      JSON.parse(updated);
    }).not.toThrow();
  });
});
