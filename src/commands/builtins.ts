import type { CommandDefinition } from '../types/index.js';

const resolveCachePolicy = (forceOption: unknown, cachedOption: unknown) => {
  if (forceOption === true) {
    return 'force' as const;
  }

  if (cachedOption === true) {
    return 'prefer-cache' as const;
  }

  return 'force' as const;
};

const resolveUpdateFetchPolicy = (
  forceOption: unknown,
  cachedOption: unknown,
  defaultPolicy: 'auto' | 'cache-only' = 'auto'
) => {
  if (forceOption === true) {
    return 'force' as const;
  }

  if (cachedOption === true) {
    return 'cache-only' as const;
  }

  return defaultPolicy;
};

const resolveScope = (scopeOption: unknown, positionalScope?: string) => {
  const scope = typeof positionalScope === 'string' ? positionalScope : scopeOption;

  if (scope === 'workspace') {
    return 'workspace' as const;
  }

  if (scope === 'machine') {
    return 'machine' as const;
  }

  if (scope === 'developer-home') {
    return 'developer-home' as const;
  }

  return 'developer-home' as const;
};

export const createBuiltInCommands = (): CommandDefinition[] => [
  {
    name: 'scan',
    description: 'Run project and cache discovery across your developer roots.',
    aliases: ['rescan', 'refresh'],
    usage: '/scan [workspace|developer-home|machine] [--cached] [--force]',
    examples: ['/scan', '/scan --scope=machine'],
    completion: {
      entries: [
        {
          kind: 'argument',
          value: 'workspace',
          description: 'Scan the current workspace.'
        },
        {
          kind: 'argument',
          value: 'developer-home',
          description: 'Scan the default developer roots.'
        },
        {
          kind: 'argument',
          value: 'machine',
          description: 'Scan every configured machine root.'
        },
        {
          kind: 'flag',
          value: '--scope',
          description: 'Set the scan scope.',
          values: ['workspace', 'developer-home', 'machine']
        },
        {
          kind: 'flag',
          value: '--cached',
          description: 'Prefer cached scan results.'
        },
        {
          kind: 'flag',
          value: '--force',
          description: 'Bypass caches and refresh data.'
        }
      ]
    },
    execute: async (parsed) => ({
      message: 'Started a full environment scan.',
      targetSection: 'dashboard',
      triggerProjectScan: true,
      triggerCleanupScan: true,
      triggerDoctorScan: true,
      cachePolicy: resolveCachePolicy(parsed.options.force, parsed.options.cached),
      updateFetchPolicy: resolveUpdateFetchPolicy(
        parsed.options.force,
        parsed.options.cached,
        'cache-only'
      ),
      scope: resolveScope(parsed.options.scope, parsed.args[0])
    })
  },
  {
    name: 'doctor',
    description: 'Check runtime availability and environment health.',
    aliases: ['diag', 'health'],
    usage: '/doctor [--cached] [--force]',
    completion: {
      entries: [
        {
          kind: 'flag',
          value: '--cached',
          description: 'Use cached health data when available.'
        },
        {
          kind: 'flag',
          value: '--force',
          description: 'Refresh diagnostics from live tools.'
        }
      ]
    },
    execute: async (parsed) => ({
      message: 'Running environment diagnostics.',
      targetSection: 'scripts',
      triggerDoctorScan: true,
      cachePolicy: resolveCachePolicy(parsed.options.force, parsed.options.cached),
      updateFetchPolicy: resolveUpdateFetchPolicy(parsed.options.force, parsed.options.cached)
    })
  },
  {
    name: 'updates',
    description: 'Check available updates for global environment tools.',
    aliases: ['upgrade', 'versions'],
    usage: '/updates [--cached] [--force]',
    completion: {
      entries: [
        {
          kind: 'flag',
          value: '--cached',
          description: 'Use cached update data when available.'
        },
        {
          kind: 'flag',
          value: '--force',
          description: 'Refresh update data from live sources.'
        }
      ]
    },
    execute: async (parsed) => ({
      message: 'Checking environment updates.',
      targetSection: 'scripts',
      triggerDoctorScan: true,
      updatesOnly: true,
      cachePolicy: resolveCachePolicy(parsed.options.force, parsed.options.cached),
      updateFetchPolicy: resolveUpdateFetchPolicy(parsed.options.force, parsed.options.cached)
    })
  },
  {
    name: 'projects',
    description: 'Open the project inventory and trigger project discovery.',
    aliases: ['repos', 'apps'],
    usage: '/projects [workspace|developer-home|machine] [--cached] [--force]',
    completion: {
      entries: [
        {
          kind: 'argument',
          value: 'workspace',
          description: 'Open the current workspace inventory.'
        },
        {
          kind: 'argument',
          value: 'developer-home',
          description: 'Open the developer-home inventory.'
        },
        {
          kind: 'argument',
          value: 'machine',
          description: 'Open the machine-wide inventory.'
        },
        {
          kind: 'flag',
          value: '--scope',
          description: 'Set the project scan scope.',
          values: ['workspace', 'developer-home', 'machine']
        },
        {
          kind: 'flag',
          value: '--cached',
          description: 'Prefer cached project data.'
        },
        {
          kind: 'flag',
          value: '--force',
          description: 'Refresh the project scan.'
        }
      ]
    },
    execute: async (parsed) => ({
      message: 'Loading local projects.',
      targetSection: 'packages',
      triggerProjectScan: true,
      cachePolicy: resolveCachePolicy(parsed.options.force, parsed.options.cached),
      scope: resolveScope(parsed.options.scope, parsed.args[0])
    })
  },
  {
    name: 'cache',
    description: 'Inspect cache-heavy directories and build artifacts.',
    aliases: ['caches'],
    usage: '/cache [workspace|developer-home|machine] [--cached] [--force]',
    completion: {
      entries: [
        {
          kind: 'argument',
          value: 'workspace',
          description: 'Inspect the current workspace cache.'
        },
        {
          kind: 'argument',
          value: 'developer-home',
          description: 'Inspect developer-home caches.'
        },
        {
          kind: 'argument',
          value: 'machine',
          description: 'Inspect machine-wide caches.'
        },
        {
          kind: 'flag',
          value: '--scope',
          description: 'Set the cache inspection scope.',
          values: ['workspace', 'developer-home', 'machine']
        },
        {
          kind: 'flag',
          value: '--cached',
          description: 'Prefer cached cache data.'
        },
        {
          kind: 'flag',
          value: '--force',
          description: 'Refresh cache inspection results.'
        }
      ]
    },
    execute: async (parsed) => ({
      message: 'Scanning cache and artifact directories.',
      targetSection: 'cleanup',
      triggerCleanupScan: true,
      cachePolicy: resolveCachePolicy(parsed.options.force, parsed.options.cached),
      scope: resolveScope(parsed.options.scope, parsed.args[0])
    })
  },
  {
    name: 'cleanup',
    description: 'Review safe cleanup candidates across your machine.',
    aliases: ['clean'],
    usage:
      '/cleanup [workspace|developer-home|machine] [--cached] [--force] [--dry-run] [--delete-safe --confirm]',
    examples: [
      '/cleanup',
      '/cleanup workspace --dry-run',
      '/cleanup --scope=machine --delete-safe --confirm'
    ],
    completion: {
      entries: [
        {
          kind: 'argument',
          value: 'workspace',
          description: 'Inspect cleanup candidates in the current workspace.'
        },
        {
          kind: 'argument',
          value: 'developer-home',
          description: 'Inspect cleanup candidates in developer roots.'
        },
        {
          kind: 'argument',
          value: 'machine',
          description: 'Inspect cleanup candidates across the machine.'
        },
        {
          kind: 'flag',
          value: '--scope',
          description: 'Set the cleanup scope.',
          values: ['workspace', 'developer-home', 'machine']
        },
        {
          kind: 'flag',
          value: '--cached',
          description: 'Prefer cached cleanup data.'
        },
        {
          kind: 'flag',
          value: '--force',
          description: 'Refresh cleanup candidates.'
        },
        {
          kind: 'flag',
          value: '--dry-run',
          description: 'Preview safe cleanup targets without deleting.'
        },
        {
          kind: 'flag',
          value: '--delete-safe',
          description: 'Delete safe cleanup targets when confirmed.'
        },
        {
          kind: 'flag',
          value: '--confirm',
          description: 'Confirm safe cleanup deletion.'
        }
      ]
    },
    execute: async (parsed) => {
      const wantsDeletion = parsed.options['delete-safe'] === true;
      const confirmed = parsed.options.confirm === true;
      const dryRun = parsed.options['dry-run'] === true || (wantsDeletion && !confirmed);

      return {
        message:
          wantsDeletion && confirmed
            ? 'Deleting confirmed safe cleanup candidates.'
            : dryRun
              ? 'Previewing safe cleanup candidates. No files will be deleted.'
              : 'Preparing cleanup candidates.',
        targetSection: 'cleanup',
        triggerCleanupScan: true,
        cachePolicy: resolveCachePolicy(parsed.options.force, parsed.options.cached),
        scope: resolveScope(parsed.options.scope, parsed.args[0]),
        ...(dryRun ? { cleanupDryRun: true } : {}),
        ...(wantsDeletion && confirmed ? { cleanupDeletionMode: 'safe' as const } : {})
      };
    }
  },
  {
    name: 'help',
    description: 'List commands, aliases, and keyboard shortcuts.',
    aliases: ['?'],
    usage: '/help',
    execute: async () => ({
      message: 'Command reference loaded.',
      targetSection: 'search',
      showHelp: true
    })
  },
  {
    name: 'settings',
    description: 'Open preferences and workspace settings.',
    aliases: ['config', 'preferences'],
    usage: '/settings',
    execute: async () => ({
      message: 'Settings panel opened.',
      targetSection: 'settings'
    })
  },
  {
    name: 'info',
    description: 'Open the tool information and credits panel.',
    aliases: ['about'],
    usage: '/info',
    execute: async () => ({
      message: 'About panel opened.',
      targetSection: 'about'
    })
  }
];
