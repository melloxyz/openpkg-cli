import { APP_NAME } from './app-metadata.js';
import type { CleanupTargetKind, NavigationSection } from '../types/index.js';

export { APP_NAME };

export const OPENPKG_BOX_MARK = ['◇'] as const;

export const NAVIGATION_ITEMS: Array<{
  key: NavigationSection;
  label: string;
  shortcut: string;
  icon: string;
  description: string;
}> = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    shortcut: '1',
    icon: '◇',
    description: 'Workspace health and package signals.'
  },
  {
    key: 'packages',
    label: 'Packages',
    shortcut: '2',
    icon: '□',
    description: 'Package inventory and project metadata.'
  },
  {
    key: 'cleanup',
    label: 'Cleanup',
    shortcut: '3',
    icon: '⌧',
    description: 'Safe cleanup candidates and recoverable space.'
  },
  {
    key: 'scripts',
    label: 'Scripts',
    shortcut: '4',
    icon: '›',
    description: 'Command shortcuts and workflow actions.'
  },
  {
    key: 'registry',
    label: 'Registry',
    shortcut: '5',
    icon: '◎',
    description: 'Command registry, cache state, and tool health.'
  },
  {
    key: 'search',
    label: 'Search',
    shortcut: '6',
    icon: '?',
    description: 'Command palette, fuzzy actions, and filters.'
  },
  {
    key: 'settings',
    label: 'Settings',
    shortcut: '7',
    icon: '=',
    description: 'Workspace defaults, scope, and preferences.'
  },
  {
    key: 'about',
    label: 'Info',
    shortcut: '8',
    icon: 'i',
    description: 'Version, links, roadmap, and credits.'
  }
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
