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

const detectFramework = (content: ProjectManifest): ProjectFramework => {
  const dependencies = {
    ...content.dependencies,
    ...content.devDependencies
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

  return 'unknown';
};

const getProjectName = (manifest: ProjectManifest, projectPath: string) =>
  manifest.name?.trim() ? manifest.name : path.basename(projectPath);

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

    const records = await mapWithConcurrency(
      [...new Set(manifestPaths)],
      Math.min(6, Math.max(2, os.cpus().length)),
      async (manifestPath) => {
        const projectPath = path.dirname(manifestPath);
        const parsedManifest = JSON.parse(await fs.readFile(manifestPath, 'utf8')) as unknown;
        const manifest = projectManifestSchema.parse(parsedManifest);
        const stats = await fs.stat(projectPath).catch(() => undefined);
        const packageManager = await this.#packageManagerDetector.detect(projectPath);
        const sizeInBytes = await this.#sizeService.getDirectorySize(projectPath).catch(() => 0);
        const lastActivityAt = stats?.mtime.toISOString();

        return {
          id: projectPath,
          name: getProjectName(manifest, projectPath),
          path: projectPath,
          framework: detectFramework(manifest),
          packageManager,
          sizeInBytes,
          activityStatus: getProjectActivityStatus(lastActivityAt),
          ...(lastActivityAt ? { lastActivityAt } : {})
        } satisfies ProjectRecord;
      }
    );

    const deduped = [...new Map(records.map((record) => [record.path, record])).values()];
    const completedAt = new Date().toISOString();

    return {
      roots,
      startedAt,
      completedAt,
      durationMs: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
      records: deduped.sort((left, right) => {
        return (right.lastActivityAt ?? '').localeCompare(left.lastActivityAt ?? '');
      })
    };
  }
}
