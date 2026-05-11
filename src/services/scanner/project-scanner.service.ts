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
import type { ProjectFramework, ProjectRecord, ScanSummary } from '../../types/index.js';
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

  return 'unknown';
};

const getProjectName = (manifest: ProjectManifest | undefined, projectPath: string) =>
  manifest?.name?.trim() ? manifest.name : path.basename(projectPath);

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

const getProjectSignals = (projectFiles: Set<string>) => {
  const signals: string[] = [];

  if (
    projectFiles.has('Dockerfile') ||
    projectFiles.has('docker-compose.yml') ||
    projectFiles.has('docker-compose.yaml') ||
    projectFiles.has('compose.yml') ||
    projectFiles.has('compose.yaml')
  ) {
    signals.push('docker');
  }

  if (projectFiles.has('pyproject.toml') || projectFiles.has('requirements.txt')) {
    signals.push('python');
  }

  return signals;
};

export class ProjectScannerService {
  readonly #packageManagerDetector = new PackageManagerDetectorService();
  readonly #sizeService = new DirectorySizeService();

  async scan(roots: string[]): Promise<ScanSummary<ProjectRecord>> {
    const startedAt = new Date().toISOString();
    const manifestPaths = (
      await Promise.all(
        roots.map(async (root) =>
          fastGlob(COMMON_PROJECT_FILENAMES, {
            cwd: root,
            absolute: true,
            suppressErrors: true,
            ignore: DEFAULT_SCAN_EXCLUDES,
            deep: 5
          })
        )
      )
    ).flat();

    const projectFileMap = new Map<string, Set<string>>();

    for (const manifestPath of [...new Set(manifestPaths)]) {
      const projectPath = path.dirname(manifestPath);
      const projectFiles = projectFileMap.get(projectPath) ?? new Set<string>();
      projectFiles.add(path.basename(manifestPath));
      projectFileMap.set(projectPath, projectFiles);
    }

    const records = await mapWithConcurrency(
      [...projectFileMap.entries()],
      Math.min(6, Math.max(2, os.cpus().length)),
      async ([projectPath, projectFiles]) => {
        const packageJsonPath = path.join(projectPath, 'package.json');
        const parsedManifest = await fs
          .readFile(packageJsonPath, 'utf8')
          .then(content => JSON.parse(content) as unknown)
          .catch(() => undefined);
        const manifest = parsedManifest ? projectManifestSchema.parse(parsedManifest) : undefined;
        const stats = await fs.stat(projectPath).catch(() => undefined);
        const packageManager = await this.#packageManagerDetector.detect(projectPath, manifest);
        const sizeInBytes = await this.#sizeService.getDirectorySize(projectPath).catch(() => 0);
        const lastActivityAt = stats?.mtime.toISOString();
        const signals = getProjectSignals(projectFiles);

        return {
          id: projectPath,
          name: getProjectName(manifest, projectPath),
          path: projectPath,
          framework: detectFramework(manifest, projectFiles),
          packageManager,
          sizeInBytes,
          activityStatus: getProjectActivityStatus(lastActivityAt),
          ...(signals.length > 0 ? { signals } : {}),
          ...(lastActivityAt ? { lastActivityAt } : {})
        } satisfies ProjectRecord;
      }
    );

    const completedAt = new Date().toISOString();

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
