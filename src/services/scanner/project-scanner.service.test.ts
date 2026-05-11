import { mkdtemp, mkdir, rm, utimes, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ProjectScannerService } from './project-scanner.service.js';

const tempDirectories: string[] = [];

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);

const writeProjectManifest = async (projectPath: string, manifest: Record<string, unknown>) => {
  await mkdir(projectPath, { recursive: true });
  await writeFile(path.join(projectPath, 'package.json'), JSON.stringify(manifest), 'utf8');
};

afterEach(async () => {
  await Promise.all(
    tempDirectories
      .splice(0, tempDirectories.length)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe('ProjectScannerService', () => {
  it('scans projects and infers framework, package manager, signals and activity', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'openpgk-project-scan-'));
    tempDirectories.push(root);

    const reactPath = path.join(root, 'react-app');
    const apiPath = path.join(root, 'api-service');
    const pythonPath = path.join(root, 'python-tool');

    await writeProjectManifest(reactPath, {
      name: 'react-app',
      packageManager: 'pnpm@9.0.0',
      dependencies: { react: '^19.0.0' }
    });
    await writeFile(path.join(reactPath, 'pnpm-lock.yaml'), 'lockfileVersion: 9');
    await writeFile(path.join(reactPath, 'Dockerfile'), 'FROM node:22');

    await writeProjectManifest(apiPath, {
      name: 'api-service',
      dependencies: { express: '^5.0.0' }
    });
    await writeFile(path.join(apiPath, 'package-lock.json'), '{}');

    await mkdir(pythonPath, { recursive: true });
    await writeFile(path.join(pythonPath, 'pyproject.toml'), '[tool.poetry]\nname = "python-tool"');

    const reactTime = daysAgo(2);
    const apiTime = daysAgo(30);
    const pythonTime = daysAgo(90);
    await Promise.all([
      utimes(reactPath, reactTime, reactTime),
      utimes(apiPath, apiTime, apiTime),
      utimes(pythonPath, pythonTime, pythonTime)
    ]);

    const scanner = new ProjectScannerService();
    const summary = await scanner.scan([root]);

    expect(summary.records).toHaveLength(3);

    const react = summary.records.find((record) => record.name === 'react-app');
    const api = summary.records.find((record) => record.name === 'api-service');
    const python = summary.records.find((record) => record.name === 'python-tool');

    expect(react).toMatchObject({
      name: 'react-app',
      framework: 'react',
      packageManager: 'pnpm',
      activityStatus: 'active'
    });
    expect(path.normalize(react?.path ?? '')).toBe(path.normalize(reactPath));
    expect(react?.signals).toContain('docker');

    expect(api).toMatchObject({
      name: 'api-service',
      framework: 'node-api',
      packageManager: 'npm',
      activityStatus: 'stale'
    });
    expect(path.normalize(api?.path ?? '')).toBe(path.normalize(apiPath));

    expect(python).toMatchObject({
      name: 'python-tool',
      framework: 'python',
      packageManager: 'poetry',
      activityStatus: 'inactive'
    });
    expect(path.normalize(python?.path ?? '')).toBe(path.normalize(pythonPath));
  });

  it('handles invalid package.json by falling back to directory name and unknown framework', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'openpgk-project-scan-'));
    tempDirectories.push(root);

    const brokenProject = path.join(root, 'broken-project');
    await mkdir(brokenProject, { recursive: true });
    await writeFile(path.join(brokenProject, 'package.json'), '{not-valid-json', 'utf8');
    await writeFile(path.join(brokenProject, 'Dockerfile'), 'FROM node:22');

    const scanner = new ProjectScannerService();
    const summary = await scanner.scan([root]);

    expect(summary.records).toHaveLength(1);
    expect(summary.records[0]).toMatchObject({
      name: 'broken-project',
      framework: 'unknown',
      packageManager: 'unknown'
    });
    expect(summary.records[0]?.signals).toContain('docker');
  });
});
