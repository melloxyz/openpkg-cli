import { afterEach, describe, expect, it, vi } from 'vitest';
import { EnvironmentUpdatesService } from './environment-updates.service.js';
import type { EnvironmentHealthSnapshot, EnvironmentUpdatesSnapshot } from '../types/index.js';

const buildHealthSnapshot = (): EnvironmentHealthSnapshot => ({
  nodeVersion: 'v24.15.0',
  platform: process.platform,
  packageManagers: { npm: true, pnpm: true, yarn: false, bun: false },
  toolVersions: {
    node: 'v24.15.0',
    npm: '10.0.0',
    pnpm: '10.21.0'
  },
  toolAvailability: [
    { name: 'node', category: 'runtime', available: true, version: 'v24.15.0' },
    { name: 'npm', category: 'package-manager', available: true, version: '10.0.0' },
    { name: 'pnpm', category: 'package-manager', available: true, version: '10.21.0' },
    { name: 'yarn', category: 'package-manager', available: false }
  ],
  recommendations: []
});

describe('EnvironmentUpdatesService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches latest versions from supported remote sources', async () => {
    const fetchMock = vi.fn(async (input: string) => {
      if (input.endsWith('/npm/latest')) {
        return {
          ok: true,
          json: async () => ({ version: '11.0.0' })
        };
      }

      if (input.endsWith('/pnpm/latest')) {
        return {
          ok: true,
          json: async () => ({ version: '10.21.0' })
        };
      }

      if (input.endsWith('/yarn/latest')) {
        return {
          ok: true,
          json: async () => ({ version: '1.22.22' })
        };
      }

      if (input.includes('bun/releases/latest')) {
        return {
          ok: true,
          json: async () => ({ tag_name: 'bun-v1.3.13' })
        };
      }

      if (input.includes('nodejs.org/dist/index.json')) {
        return {
          ok: true,
          json: async () => [{ version: 'v24.16.0' }]
        };
      }

      throw new Error(`Unexpected url: ${input}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    const service = new EnvironmentUpdatesService();
    const snapshot = await service.getSnapshot();

    expect(snapshot.tools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'npm', latestVersion: '11.0.0', fetchState: 'ok' }),
        expect.objectContaining({ name: 'pnpm', latestVersion: '10.21.0', fetchState: 'ok' }),
        expect.objectContaining({ name: 'yarn', latestVersion: '1.22.22', fetchState: 'ok' }),
        expect.objectContaining({ name: 'bun', latestVersion: '1.3.13', fetchState: 'ok' }),
        expect.objectContaining({ name: 'node', latestVersion: '24.16.0', fetchState: 'ok' })
      ])
    );
  });

  it('merges remote data into health snapshot and computes update status', () => {
    const service = new EnvironmentUpdatesService();
    const health = buildHealthSnapshot();
    const updates: EnvironmentUpdatesSnapshot = {
      checkedAt: new Date('2026-05-12T12:00:00.000Z').toISOString(),
      tools: [
        { name: 'node', latestVersion: '24.16.0', source: 'nodejs', fetchState: 'ok' },
        { name: 'npm', latestVersion: '11.0.0', source: 'npm', fetchState: 'ok' },
        { name: 'pnpm', latestVersion: '10.21.0', source: 'npm', fetchState: 'ok' },
        { name: 'yarn', latestVersion: '1.22.22', source: 'npm', fetchState: 'ok' },
        { name: 'bun', source: 'github', fetchState: 'offline' }
      ]
    };

    const merged = service.mergeHealthSnapshot(health, updates);

    expect(merged.updatesCheckedAt).toBe(updates.checkedAt);
    expect(merged.toolAvailability.find((tool) => tool.name === 'npm')).toMatchObject({
      latestVersion: '11.0.0',
      updateStatus: 'outdated',
      updateSource: 'npm'
    });
    expect(merged.toolAvailability.find((tool) => tool.name === 'pnpm')).toMatchObject({
      latestVersion: '10.21.0',
      updateStatus: 'current',
      updateSource: 'npm'
    });
    expect(merged.toolAvailability.find((tool) => tool.name === 'yarn')).toMatchObject({
      latestVersion: '1.22.22',
      updateStatus: 'unknown',
      updateSource: 'npm'
    });
    expect(merged.recommendations.some((entry) => entry.includes('npm has an update available'))).toBe(
      true
    );
  });

  it('marks updates as offline when remote requests fail', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('offline'))));

    const service = new EnvironmentUpdatesService();
    const snapshot = await service.getSnapshot();

    expect(snapshot.tools.every((tool) => tool.fetchState === 'offline')).toBe(true);
  });
});
