import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type {
  CleanupTargetRecord,
  EnvironmentHealthSnapshot,
  ProjectRecord,
  ScanSummary
} from '../types/index.js';

type PersistedCache = {
  version: 1;
  scans: {
    projects?: {
      rootsKey: string;
      updatedAt: string;
      summary: ScanSummary<ProjectRecord>;
    };
    cleanup?: {
      rootsKey: string;
      updatedAt: string;
      summary: ScanSummary<CleanupTargetRecord>;
    };
    health?: {
      updatedAt: string;
      snapshot: EnvironmentHealthSnapshot;
    };
  };
};

const CACHE_TTL_MS = 5 * 60 * 1000;

export class ScanCacheService {
  readonly #cachePath = path.join(os.homedir(), '.openpgk', 'cache.json');

  async getProjectSummary(roots: string[], maxAgeMs = CACHE_TTL_MS) {
    const cache = await this.#readCache();
    const cached = cache.scans.projects;

    if (!cached || cached.rootsKey !== this.#getRootsKey(roots)) {
      return undefined;
    }

    return this.#isFresh(cached.updatedAt, maxAgeMs) ? cached.summary : undefined;
  }

  async setProjectSummary(summary: ScanSummary<ProjectRecord>) {
    const cache = await this.#readCache();
    cache.scans.projects = {
      rootsKey: this.#getRootsKey(summary.roots),
      updatedAt: new Date().toISOString(),
      summary
    };
    await this.#writeCache(cache);
  }

  async getCleanupSummary(roots: string[], maxAgeMs = CACHE_TTL_MS) {
    const cache = await this.#readCache();
    const cached = cache.scans.cleanup;

    if (!cached || cached.rootsKey !== this.#getRootsKey(roots)) {
      return undefined;
    }

    return this.#isFresh(cached.updatedAt, maxAgeMs) ? cached.summary : undefined;
  }

  async setCleanupSummary(summary: ScanSummary<CleanupTargetRecord>) {
    const cache = await this.#readCache();
    cache.scans.cleanup = {
      rootsKey: this.#getRootsKey(summary.roots),
      updatedAt: new Date().toISOString(),
      summary
    };
    await this.#writeCache(cache);
  }

  async getHealthSnapshot(maxAgeMs = CACHE_TTL_MS) {
    const cache = await this.#readCache();
    const cached = cache.scans.health;
    return cached && this.#isFresh(cached.updatedAt, maxAgeMs) ? cached.snapshot : undefined;
  }

  async setHealthSnapshot(snapshot: EnvironmentHealthSnapshot) {
    const cache = await this.#readCache();
    cache.scans.health = {
      updatedAt: new Date().toISOString(),
      snapshot
    };
    await this.#writeCache(cache);
  }

  async #readCache(): Promise<PersistedCache> {
    try {
      const raw = await fs.readFile(this.#cachePath, 'utf8');
      return JSON.parse(raw) as PersistedCache;
    } catch {
      return {
        version: 1,
        scans: {}
      };
    }
  }

  async #writeCache(cache: PersistedCache) {
    await fs.mkdir(path.dirname(this.#cachePath), { recursive: true });
    await fs.writeFile(this.#cachePath, JSON.stringify(cache, null, 2), 'utf8');
  }

  #getRootsKey(roots: string[]) {
    return [...roots].sort().join('|');
  }

  #isFresh(updatedAt: string, maxAgeMs: number) {
    return Date.now() - new Date(updatedAt).getTime() <= maxAgeMs;
  }
}
