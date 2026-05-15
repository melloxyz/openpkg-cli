import { promises as fs } from 'node:fs';
import os from 'node:os';
import fastGlob from 'fast-glob';
import path from 'node:path';
import { COMMON_PROJECT_FILENAMES, DEFAULT_SCAN_EXCLUDES } from '../../shared/constants.js';
import {
  projectManifestSchema,
  type ProjectManifest
} from '../../shared/schemas/project-manifest.schema.js';
import { PackageManagerDetectorService } from '../package-manager-detector.service.js';
import { DirectorySizeService } from './directory-size.service.js';
import type { ProjectFramework, ProjectRecord, ScanOptions, ScanSummary } from '../../types/index.js';
import { mapWithConcurrency } from '../../utils/async.js';

const detectFramework = (
  manifest: ProjectManifest | undefined,
  projectFiles: Set<string>
): ProjectFramework => {
  const dependencies = {
    ...manifest?.dependencies,
    ...manifest?.devDependencies
  };

  if ('next' in dependencies) {
    return 'nextjs';
  }
  if ('react' in dependencies) {
    return 'react';
  }
  if ('vue' in dependencies) {
    return 'vue';
  }
  if ('@angular/core' in dependencies) {
    return 'angular';
  }
  if ('electron' in dependencies) {
    return 'electron';
  }
  if ('express' in dependencies || 'fastify' in dependencies || 'hono' in dependencies) {
    return 'node-api';
  }
  if (
    projectFiles.has('pyproject.toml') ||
    projectFiles.has('requirements.txt')
  ) {
    return 'python';
  }
  if (
    projectFiles.has('Dockerfile') ||
    projectFiles.has('docker-compose.yml') ||
    projectFiles.has('compose.yml')
  ) {
    return 'docker';
  }

  return 'unknown';
};

const getProjectName = async (manifest: ProjectManifest | undefined, projectPath: string, projectFiles: Set<string>) => {
  if (manifest?.name?.trim()) {
    return manifest.name;
  }

  if (projectFiles.has('pyproject.toml')) {
    const pyprojectContent = await fs.readFile(path.join(projectPath, 'pyproject.toml'), 'utf8').catch(() => undefined);
    const nameMatch = pyprojectContent?.match(/^name\s*=\s*"([^"]+)"/m) ?? pyprojectContent?.match(/^name\s*=\s*'([^']+)'/m);
    if (nameMatch?.[1]) {
      return nameMatch[1];
    }
  }

  return path.basename(projectPath);
};

const getProjectActivityStatus = (
  lastActivityAt?: string
): ProjectRecord['activityStatus'] => {
  if (!lastActivityAt) {
    return 'inactive';
  }

  const days = (Date.now() - new Date(lastActivityAt).getTime()) / 86_400_000;
  if (days <= 14) {
    return 'active';
  }

  if (days <= 60) {
    return 'stale';
  }

  return 'inactive';
};

const getLatestProjectActivity = async (projectPath: string, projectFiles: Set<string>) => {
  const candidatePaths = [
    ...projectFiles,
    'package.json',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    'bun.lock',
    'bun.lockb',
    'Cargo.lock',
    'deno.lock',
    'Gemfile.lock',
    'Cargo.toml',
    'deno.json',
    'deno.jsonc',
    'Gemfile'
  ].map((relativePath) => path.join(projectPath, relativePath));

  const timestamps = await Promise.all(
    [...new Set(candidatePaths)].map(async (candidatePath) => {
      const stats = await fs.stat(candidatePath).catch(() => undefined);
      return stats?.mtime.toISOString();
    })
  );

  return timestamps
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => right.localeCompare(left))[0];
};

const getProjectSignals = async (projectPath: string, projectFiles: Set<string>) => {
  const signals: string[] = [];

  if (
    projectFiles.has('Dockerfile') ||
    projectFiles.has('docker-compose.yml') ||
    projectFiles.has('docker-compose.yaml') ||
    projectFiles.has('compose.yml') ||
    projectFiles.has('compose.yaml')
  ) {
    signals.push('docker');

    const composeFile = ['docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml'].find(f => projectFiles.has(f));
    if (composeFile) {
      const composeContent = await fs.readFile(path.join(projectPath, composeFile), 'utf8').catch(() => undefined);
      if (composeContent) {
        const servicesMatch = [...composeContent.matchAll(/^ {2}[a-zA-Z0-9_-]+:/gm)];
        if (servicesMatch.length > 0) {
          signals.push(`docker:services:${servicesMatch.length}`);
        } else {
          signals.push('docker:compose');
        }
      }
    }
  }

  if (projectFiles.has('pyproject.toml') || projectFiles.has('requirements.txt')) {
    signals.push('python');

    if (projectFiles.has('requirements.txt')) {
      const reqContent = await fs.readFile(path.join(projectPath, 'requirements.txt'), 'utf8').catch(() => undefined);
      if (reqContent) {
        const lines = reqContent.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
        if (lines.length > 0) {
          signals.push(`python:deps:${lines.length}`);
        }
      }
    }

    const hasVenv = await fs.stat(path.join(projectPath, '.venv')).then(s => s.isDirectory()).catch(() => false);
    const hasVenvFallback = await fs.stat(path.join(projectPath, 'venv')).then(s => s.isDirectory()).catch(() => false);
    if (hasVenv || hasVenvFallback) {
      signals.push('python:venv');
    }
  }

  if (projectFiles.has('Cargo.toml')) {
    signals.push('rust');
  }

  if (projectFiles.has('deno.json') || projectFiles.has('deno.jsonc')) {
    signals.push('deno');
  }

  if (projectFiles.has('Gemfile')) {
    signals.push('ruby');
  }

  if ([...projectFiles].some(f => f.endsWith('.csproj'))) {
    signals.push('dotnet');
  }

  return signals;
};

export class ProjectScannerService {
  readonly #packageManagerDetector = new PackageManagerDetectorService();
  readonly #sizeService = new DirectorySizeService();

  async scan(roots: string[], options: ScanOptions = {}): Promise<ScanSummary<ProjectRecord>> {
    const startedAt = new Date().toISOString();
    const manifestPaths: string[] = [];

    for (const [index, root] of roots.entries()) {
      const discoveredPaths = await fastGlob(COMMON_PROJECT_FILENAMES, {
        cwd: root,
        absolute: true,
        suppressErrors: true,
        ignore: DEFAULT_SCAN_EXCLUDES,
        deep: 5,
        followSymbolicLinks: false,
        throwErrorOnBrokenSymbolicLink: false
      });

      manifestPaths.push(...discoveredPaths);
      options.onProgress?.({
        currentPath: root,
        visited: index + 1,
        matched: manifestPaths.length,
        total: Math.max(1, roots.length),
        phase: 'discovering'
      });
    }

    const projectFileMap = new Map<string, Set<string>>();

    for (const manifestPath of [...new Set(manifestPaths)]) {
      const projectPath = path.dirname(manifestPath);
      const projectFiles = projectFileMap.get(projectPath) ?? new Set<string>();
      projectFiles.add(path.basename(manifestPath));
      projectFileMap.set(projectPath, projectFiles);
    }

    let processedProjects = 0;
    const records = await mapWithConcurrency(
      [...projectFileMap.entries()],
      Math.min(6, Math.max(2, os.cpus().length)),
      async ([projectPath, projectFiles]) => {
        const packageJsonPath = path.join(projectPath, 'package.json');
        const parsedManifest = await fs
          .readFile(packageJsonPath, 'utf8')
          .then(content => JSON.parse(content) as unknown)
          .catch(() => undefined);
        const manifestResult = parsedManifest
          ? projectManifestSchema.safeParse(parsedManifest)
          : undefined;
        const manifest = manifestResult?.success ? manifestResult.data : undefined;
        const packageManager = await this.#packageManagerDetector.detect(projectPath, manifest);
        const sizeInBytes = await this.#sizeService.getDirectorySize(projectPath).catch(() => 0);
        const stats = await fs.stat(projectPath).catch(() => undefined);
        const lastActivityAt =
          (await getLatestProjectActivity(projectPath, projectFiles)) ?? stats?.mtime.toISOString();
        const signals = await getProjectSignals(projectPath, projectFiles);

        return {
          id: projectPath,
          name: await getProjectName(manifest, projectPath, projectFiles),
          path: projectPath,
          framework: detectFramework(manifest, projectFiles),
          packageManager,
          sizeInBytes,
          activityStatus: getProjectActivityStatus(lastActivityAt),
          ...(signals.length > 0 ? { signals } : {}),
          ...(lastActivityAt ? { lastActivityAt } : {})
        } satisfies ProjectRecord;
      },
      {
        onResolved: async (record) => {
          processedProjects += 1;
          options.onProgress?.({
            currentPath: record.path,
            visited: processedProjects,
            matched: processedProjects,
            total: Math.max(1, projectFileMap.size),
            phase: 'sizing'
          });
        }
      }
    );

    const completedAt = new Date().toISOString();
    options.onProgress?.({
      visited: records.length,
      matched: records.length,
      total: Math.max(1, records.length),
      phase: 'done'
    });

    return {
      roots,
      startedAt,
      completedAt,
      durationMs: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
      records: records.sort((left, right) => {
        return (right.lastActivityAt ?? '').localeCompare(left.lastActivityAt ?? '');
      })
    };
  }
}
