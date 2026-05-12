import type {
  EnvironmentHealthSnapshot,
  EnvironmentToolUpdateStatus,
  EnvironmentUpdatesSnapshot
} from '../types/index.js';

const REQUEST_TIMEOUT_MS = 5_000;

const NPM_REGISTRY_LATEST_URL = 'https://registry.npmjs.org';
const NODE_RELEASE_INDEX_URL = 'https://nodejs.org/dist/index.json';
const BUN_RELEASE_URL = 'https://api.github.com/repos/oven-sh/bun/releases/latest';

const SUPPORTED_UPDATE_TOOLS = ['npm', 'pnpm', 'yarn', 'bun', 'node'] as const;

type SupportedUpdateTool = (typeof SUPPORTED_UPDATE_TOOLS)[number];

type FetchJsonOptions = {
  headers?: Record<string, string>;
};

const normalizeVersion = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const match = value.match(/\d+(?:\.\d+){0,2}/);
  return match?.[0];
};

const compareVersions = (left: string, right: string) => {
  const leftParts = left.split('.').map((part) => Number(part));
  const rightParts = right.split('.').map((part) => Number(part));
  const maxLength = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftValue = leftParts[index] ?? 0;
    const rightValue = rightParts[index] ?? 0;

    if (leftValue > rightValue) {
      return 1;
    }

    if (leftValue < rightValue) {
      return -1;
    }
  }

  return 0;
};

const fetchJson = async <T>(url: string, options: FetchJsonOptions = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
};

const buildOutdatedRecommendation = (
  tool: EnvironmentHealthSnapshot['toolAvailability'][number]
) => {
  if (!tool.version || !tool.latestVersion) {
    return undefined;
  }

  return `${tool.name} has an update available: ${tool.version} -> ${tool.latestVersion}.`;
};

export class EnvironmentUpdatesService {
  async getSnapshot(): Promise<EnvironmentUpdatesSnapshot> {
    const tools = await Promise.all(
      SUPPORTED_UPDATE_TOOLS.map(async (tool) => this.#getLatestVersion(tool))
    );

    return {
      checkedAt: new Date().toISOString(),
      tools
    };
  }

  mergeHealthSnapshot(
    health: EnvironmentHealthSnapshot,
    updates?: EnvironmentUpdatesSnapshot
  ): EnvironmentHealthSnapshot {
    if (!updates) {
      return health;
    }

    const updateMap = new Map(updates.tools.map((tool) => [tool.name, tool]));

    const toolAvailability = health.toolAvailability.map((tool) => {
      const remote = updateMap.get(tool.name as SupportedUpdateTool);

      if (!remote) {
        return tool;
      }

      return {
        ...tool,
        ...(remote.latestVersion ? { latestVersion: remote.latestVersion } : {}),
        updateSource: remote.source,
        updateStatus: this.#resolveUpdateStatus(tool, remote)
      };
    });

    const outdatedRecommendations = toolAvailability
      .filter((tool) => tool.updateStatus === 'outdated')
      .map(buildOutdatedRecommendation)
      .filter((value): value is string => Boolean(value));

    return {
      ...health,
      updatesCheckedAt: updates.checkedAt,
      toolAvailability,
      recommendations: [...new Set([...health.recommendations, ...outdatedRecommendations])]
    };
  }

  #resolveUpdateStatus(
    tool: EnvironmentHealthSnapshot['toolAvailability'][number],
    remote: EnvironmentUpdatesSnapshot['tools'][number]
  ): EnvironmentToolUpdateStatus {
    if (remote.fetchState === 'offline') {
      return 'offline';
    }

    const installedVersion = normalizeVersion(tool.version);
    const latestVersion = normalizeVersion(remote.latestVersion);

    if (!tool.available || !installedVersion || !latestVersion || remote.fetchState !== 'ok') {
      return 'unknown';
    }

    return compareVersions(installedVersion, latestVersion) < 0 ? 'outdated' : 'current';
  }

  async #getLatestVersion(tool: SupportedUpdateTool): Promise<EnvironmentUpdatesSnapshot['tools'][number]> {
    try {
      switch (tool) {
        case 'node': {
          const releases = await fetchJson<Array<{ version?: string }>>(NODE_RELEASE_INDEX_URL);
          const latestVersion = releases
            .map((release) => normalizeVersion(release.version))
            .find((version) => Boolean(version));

          return {
            name: 'node',
            source: 'nodejs',
            fetchState: latestVersion ? 'ok' : 'unknown',
            ...(latestVersion ? { latestVersion } : {})
          };
        }
        case 'bun': {
          const payload = await fetchJson<{ tag_name?: string }>(BUN_RELEASE_URL, {
            headers: {
              'User-Agent': 'OpenPkg'
            }
          });
          const latestVersion = normalizeVersion(payload.tag_name);

          return {
            name: 'bun',
            source: 'github',
            fetchState: latestVersion ? 'ok' : 'unknown',
            ...(latestVersion ? { latestVersion } : {})
          };
        }
        default: {
          const payload = await fetchJson<{ version?: string }>(
            `${NPM_REGISTRY_LATEST_URL}/${tool}/latest`
          );
          const latestVersion = normalizeVersion(payload.version);

          return {
            name: tool,
            source: 'npm',
            fetchState: latestVersion ? 'ok' : 'unknown',
            ...(latestVersion ? { latestVersion } : {})
          };
        }
      }
    } catch {
      return {
        name: tool,
        source: tool === 'node' ? 'nodejs' : tool === 'bun' ? 'github' : 'npm',
        fetchState: 'offline'
      };
    }
  }
}
