import { mkdtemp, mkdir, rm, utimes, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockScanRoots = vi.hoisted(() => ({
  defaultRoots: [] as string[],
  machineRoots: [] as string[]
}));

vi.mock('../../utils/filesystem.js', async () => {
  const actual = await vi.importActual<typeof import('../../utils/filesystem.js')>(
    '../../utils/filesystem.js'
  );

  return {
    ...actual,
    getDefaultProjectRoots: vi.fn(async () => mockScanRoots.defaultRoots),
    getMachineScanRoots: vi.fn(async () => mockScanRoots.machineRoots)
  };
});

import { DashboardController } from './dashboard-controller.js';

const tempDirectories: string[] = [];
const originalCwd = process.cwd();

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);

const createProject = async (
  root: string,
  projectName: string,
  manifest: Record<string, unknown>,
  extraFiles: Array<{ name: string; content: string }> = []
) => {
  const projectPath = path.join(root, projectName);
  await mkdir(projectPath, { recursive: true });
  await writeFile(path.join(projectPath, 'package.json'), JSON.stringify(manifest), 'utf8');

  await Promise.all(
    extraFiles.map((file) => writeFile(path.join(projectPath, file.name), file.content, 'utf8'))
  );

  return projectPath;
};

const createCleanupDirectory = async (
  root: string,
  relativePath: string,
  modifiedDaysAgo: number
) => {
  const directoryPath = path.join(root, relativePath);
  await mkdir(directoryPath, { recursive: true });
  await writeFile(path.join(directoryPath, 'artifact.bin'), 'temporary artifact', 'utf8');
  const modifiedAt = daysAgo(modifiedDaysAgo);
  await utimes(directoryPath, modifiedAt, modifiedAt);
  await utimes(path.join(directoryPath, 'artifact.bin'), modifiedAt, modifiedAt);
  return directoryPath;
};

afterEach(async () => {
  vi.restoreAllMocks();
  process.chdir(originalCwd);
  mockScanRoots.defaultRoots = [];
  mockScanRoots.machineRoots = [];
  await Promise.all(
    tempDirectories
      .splice(0, tempDirectories.length)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe('DashboardController', () => {
  it('returns unknown-command snapshot without running scanners', async () => {
    const controller = new DashboardController();
    const snapshot = await controller.runCommand('/does-not-exist', {
      scopeOverride: 'workspace'
    });

    expect(snapshot.scope).toBe('workspace');
    expect(snapshot.roots).toEqual([process.cwd()]);
    expect(snapshot.statusLine).toBe('Unknown command: /does-not-exist');
  });

  it('refreshes settings section without scan side-effects', async () => {
    const home = await mkdtemp(path.join(os.tmpdir(), 'openpkg-dashboard-cache-'));
    tempDirectories.push(home);
    vi.spyOn(os, 'homedir').mockReturnValue(home);
    const controller = new DashboardController();
    const snapshot = await controller.refreshSection('settings', 'workspace');

    expect(snapshot.activeSection).toBe('settings');
    expect(snapshot.scope).toBe('workspace');
    expect(snapshot.statusLine).toBe('Settings panel refreshed.');
    expect(snapshot.settings?.scope).toBe('workspace');
    expect(snapshot.settings?.availableCommands.length).toBeGreaterThan(0);
    expect(snapshot.settings?.cacheState).toMatchObject({
      projectsLoaded: 0,
      cleanupLoaded: 0,
      healthLoaded: false
    });
  });

  it('refreshes about section without scan side-effects', async () => {
    const home = await mkdtemp(path.join(os.tmpdir(), 'openpkg-dashboard-about-'));
    tempDirectories.push(home);
    vi.spyOn(os, 'homedir').mockReturnValue(home);
    const controller = new DashboardController();
    const snapshot = await controller.refreshSection('about', 'workspace');

    expect(snapshot.activeSection).toBe('about');
    expect(snapshot.scope).toBe('workspace');
    expect(snapshot.statusLine).toBe('About panel refreshed.');
    expect(snapshot.settings).toBeUndefined();
    expect(snapshot.helpLines).toBeUndefined();
  });

  it('keeps explicit command scope ahead of the UI default scope', async () => {
    const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), 'openpkg-dashboard-explicit-'));
    tempDirectories.push(workspaceRoot);
    process.chdir(workspaceRoot);

    const controller = new DashboardController();
    const snapshot = await controller.runCommand('/projects workspace --force', {
      scopeOverride: 'machine'
    });

    expect(snapshot.scope).toBe('workspace');
    expect(snapshot.roots).toEqual([workspaceRoot]);
  });

  it('exposes formatted help lines', () => {
    const controller = new DashboardController();
    const helpLines = controller.getHelpLines();

    expect(helpLines.length).toBeGreaterThan(0);
    expect(helpLines.some((line) => line.startsWith('/scan'))).toBe(true);
    expect(helpLines.some((line) => line.startsWith('/updates'))).toBe(true);
    expect(helpLines.some((line) => line.startsWith('/info'))).toBe(true);
  });

  it('scans the workspace scope with incremental progress updates', async () => {
    const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), 'openpkg-dashboard-workspace-'));
    tempDirectories.push(workspaceRoot);
    await createProject(
      workspaceRoot,
      'workspace-app',
      {
        name: 'workspace-app',
        dependencies: { react: '^19.0.0' }
      },
      [{ name: 'package-lock.json', content: '{}' }]
    );
    process.chdir(workspaceRoot);

    const controller = new DashboardController();
    const progressEvents: Array<{ label: string; current: number; total: number }> = [];
    const snapshot = await controller.runCommand('/projects workspace --force', {
      onProgress: (progress) => {
        if (progress) {
          progressEvents.push(progress);
        }
      }
    });

    expect(snapshot.scope).toBe('workspace');
    expect(snapshot.roots).toEqual([workspaceRoot]);
    expect(snapshot.projects?.map((project) => project.name)).toContain('workspace-app');
    expect(progressEvents.length).toBeGreaterThan(2);
    expect(progressEvents.some((entry) => entry.label.includes('discovering'))).toBe(true);
    expect(progressEvents.some((entry) => entry.label.includes('sizing'))).toBe(true);
  });

  it('uses mocked developer-home roots when scanning projects', async () => {
    const developerRoot = await mkdtemp(path.join(os.tmpdir(), 'openpkg-dashboard-home-'));
    tempDirectories.push(developerRoot);
    mockScanRoots.defaultRoots = [developerRoot];

    await createProject(
      developerRoot,
      'api-service',
      {
        name: 'api-service',
        dependencies: { express: '^5.0.0' }
      },
      [{ name: 'package-lock.json', content: '{}' }]
    );

    const controller = new DashboardController();
    const snapshot = await controller.runCommand('/projects developer-home --force');

    expect(snapshot.scope).toBe('developer-home');
    expect(snapshot.roots).toEqual([developerRoot]);
    expect(snapshot.projects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'api-service',
          framework: 'node-api',
          packageManager: 'npm'
        })
      ])
    );
  });

  it('uses mocked machine roots for cleanup dry-runs and returns a structured summary', async () => {
    const machineRoot = await mkdtemp(path.join(os.tmpdir(), 'openpkg-dashboard-machine-'));
    tempDirectories.push(machineRoot);
    mockScanRoots.machineRoots = [machineRoot];
    await createCleanupDirectory(machineRoot, 'legacy-project/dist', 45);

    const controller = new DashboardController();
    const snapshot = await controller.runCommand('/cleanup machine --dry-run --force');

    expect(snapshot.scope).toBe('machine');
    expect(snapshot.roots).toEqual([machineRoot]);
    expect(snapshot.cleanupExecution?.dryRun).toBe(true);
    expect(snapshot.cleanupExecution?.summary).toMatchObject({
      requestedCount: 1,
      plannedCount: 1,
      deletedCount: 0,
      failedCount: 0,
      dryRun: true
    });
    expect(snapshot.cleanupTargets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'dist',
          recommendation: 'safe'
        })
      ])
    );
  });
});
