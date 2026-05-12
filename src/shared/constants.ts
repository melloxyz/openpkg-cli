import type { CleanupTargetKind, NavigationSection } from '../types/index.js';

export const APP_NAME = 'OpenPkg';

export const NAVIGATION_ITEMS: Array<{
  key: NavigationSection;
  label: string;
  shortcut: string;
}> = [
  { key: 'overview', label: 'Overview', shortcut: '1' },
  { key: 'projects', label: 'Projects', shortcut: '2' },
  { key: 'cache', label: 'Caches', shortcut: '3' },
  { key: 'cleanup', label: 'Cleanup', shortcut: '4' },
  { key: 'doctor', label: 'Doctor', shortcut: '5' },
  { key: 'settings', label: 'Settings', shortcut: '6' }
];

export const CLEANUP_TARGET_PATTERNS: Record<CleanupTargetKind, string[]> = {
  node_modules: ['**/node_modules'],
  '.pnpm-store': ['**/.pnpm-store'],
  '.npm': ['**/.npm'],
  '.turbo': ['**/.turbo'],
  '.next': ['**/.next'],
  dist: ['**/dist'],
  build: ['**/build']
};

export const DEFAULT_SCAN_EXCLUDES = [
  '**/Windows/**',
  '**/Program Files/**',
  '**/Program Files (x86)/**',
  '**/System Volume Information/**',
  '**/.git/**',
  '**/.idea/**',
  '**/.vscode/**',
  '**/Library/**',
  '**/Applications/**',
  '**/node_modules/**'
];

export const COMMON_PROJECT_FILENAMES = [
  '**/package.json',
  '**/pyproject.toml',
  '**/requirements.txt',
  '**/Dockerfile',
  '**/docker-compose.yml',
  '**/docker-compose.yaml',
  '**/compose.yml',
  '**/compose.yaml'
];
