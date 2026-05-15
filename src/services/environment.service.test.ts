import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EnvironmentService } from './environment.service.js';

const mockedExeca = vi.hoisted(() => vi.fn());

vi.mock('execa', () => ({
  execa: mockedExeca
}));

describe('EnvironmentService', () => {
  beforeEach(() => {
    mockedExeca.mockReset();
  });

  it('builds health snapshot with tool availability, versions and recommendations', async () => {
    mockedExeca.mockImplementation((file: unknown) => {
      const command = String(file);

      switch (command) {
        case 'npm':
          return Promise.resolve({ exitCode: 0, all: '11.0.0' });
        case 'pnpm':
          return Promise.resolve({ exitCode: 0, all: '10.21.0' });
        case 'go':
          return Promise.resolve({ exitCode: 0, all: 'go version go1.23.0 windows/amd64' });
        case 'rustc':
          return Promise.resolve({ exitCode: 0, all: 'rustc 1.82.0 (f6e511eec 2024-10-15)' });
        case 'java':
          return Promise.resolve({ exitCode: 0, all: 'openjdk version "23"' });
        case 'cargo':
          return Promise.resolve({ exitCode: 0, all: 'cargo 1.82.0' });
        case 'deno':
          return Promise.resolve({ exitCode: 0, all: 'deno 2.0.0' });
        case 'gem':
          return Promise.resolve({ exitCode: 0, all: '3.5.0' });
        case 'dotnet':
          return Promise.resolve({ exitCode: 0, all: '8.0.100' });
        case 'poetry':
          return Promise.resolve({ exitCode: 0, all: 'Poetry (version 1.8.0)' });
        case 'pip':
          return Promise.resolve({ exitCode: 0, all: 'pip 24.0' });
        case 'brew':
          return Promise.resolve({ exitCode: 0, all: 'Homebrew 4.2.0' });
        case 'choco':
          return Promise.resolve({ exitCode: 0, all: '2.1.0' });
        case 'yarn':
        case 'bun':
        case 'python':
        case 'docker':
          return Promise.reject(new Error(`${command} missing`));
        default:
          return Promise.resolve({ exitCode: 1, all: '' });
      }
    });

    const service = new EnvironmentService();
    const snapshot = await service.getHealthSnapshot();

    expect(snapshot.packageManagers).toMatchObject({
      npm: true,
      pnpm: true,
      yarn: false,
      bun: false
    });
    expect(snapshot.toolAvailability.some((tool) => tool.name === 'npm' && tool.available)).toBe(true);
    expect(snapshot.toolAvailability.some((tool) => tool.name === 'node' && tool.available)).toBe(true);
    expect(snapshot.toolAvailability.some((tool) => tool.name === 'docker' && !tool.available)).toBe(
      true
    );
    expect(snapshot.toolVersions.npm).toBe('11.0.0');
    expect(snapshot.recommendations).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Bun is missing'),
        expect.stringContaining('Docker is missing'),
        expect.stringContaining('Python is missing')
      ])
    );
  });

  it('marks tool as unavailable when command returns non-zero exit code', async () => {
    mockedExeca.mockResolvedValue({ exitCode: 1, all: 'unknown-version' });

    const service = new EnvironmentService();
    const snapshot = await service.getHealthSnapshot();
    const npm = snapshot.toolAvailability.find((tool) => tool.name === 'npm');
    const node = snapshot.toolAvailability.find((tool) => tool.name === 'node');

    expect(npm?.available).toBe(false);
    expect(node?.available).toBe(true);
    expect(snapshot.toolVersions.npm).toBeUndefined();
  });
});
