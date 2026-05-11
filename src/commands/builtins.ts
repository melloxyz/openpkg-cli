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

const resolveScope = (scopeOption: unknown, positionalScope?: string) => {
  const scope = typeof positionalScope === 'string' ? positionalScope : scopeOption;

  if (scope === 'workspace') {
    return 'workspace' as const;
  }

  if (scope === 'machine') {
    return 'machine' as const;
  }

  return 'developer-home' as const;
};

export const createBuiltInCommands = (): CommandDefinition[] => [
  {
    name: 'scan',
    description: 'Run project and cache discovery across your developer roots.',
    aliases: ['rescan', 'refresh'],
    usage: '/scan [--scope=workspace|machine] [--cached] [--force]',
    examples: ['/scan', '/scan --scope=machine'],
    execute: async (parsed) => ({
      message: 'Started a full environment scan.',
      targetSection: 'overview',
      triggerProjectScan: true,
      triggerCleanupScan: true,
      triggerDoctorScan: true,
      cachePolicy: resolveCachePolicy(parsed.options.force, parsed.options.cached),
      scope: resolveScope(parsed.options.scope, parsed.args[0])
    })
  },
  {
    name: 'doctor',
    description: 'Check runtime availability and environment health.',
    aliases: ['diag', 'health'],
    usage: '/doctor [--cached] [--force]',
    execute: async (parsed) => ({
      message: 'Running environment diagnostics.',
      targetSection: 'doctor',
      triggerDoctorScan: true,
      cachePolicy: resolveCachePolicy(parsed.options.force, parsed.options.cached)
    })
  },
  {
    name: 'projects',
    description: 'Open the project inventory and trigger project discovery.',
    aliases: ['repos', 'apps'],
    usage: '/projects [--scope=workspace|machine] [--cached] [--force]',
    execute: async (parsed) => ({
      message: 'Loading local projects.',
      targetSection: 'projects',
      triggerProjectScan: true,
      cachePolicy: resolveCachePolicy(parsed.options.force, parsed.options.cached),
      scope: resolveScope(parsed.options.scope, parsed.args[0])
    })
  },
  {
    name: 'cache',
    description: 'Inspect cache-heavy directories and build artifacts.',
    aliases: ['caches'],
    usage: '/cache [--scope=workspace|machine] [--cached] [--force]',
    execute: async (parsed) => ({
      message: 'Scanning cache and artifact directories.',
      targetSection: 'cache',
      triggerCleanupScan: true,
      cachePolicy: resolveCachePolicy(parsed.options.force, parsed.options.cached),
      scope: resolveScope(parsed.options.scope, parsed.args[0])
    })
  },
  {
    name: 'cleanup',
    description: 'Review safe cleanup candidates across your machine.',
    aliases: ['clean'],
    usage: '/cleanup [--scope=workspace|machine] [--cached] [--force] [--delete-safe]',
    examples: ['/cleanup', '/cleanup --scope=machine --delete-safe'],
    execute: async (parsed) => ({
      message:
        parsed.options['delete-safe'] === true
          ? 'Deleting safe cleanup candidates.'
          : 'Preparing cleanup candidates.',
      targetSection: 'cleanup',
      triggerCleanupScan: true,
      cachePolicy: resolveCachePolicy(parsed.options.force, parsed.options.cached),
      scope: resolveScope(parsed.options.scope, parsed.args[0]),
      ...(parsed.options['delete-safe'] === true ? { cleanupDeletionMode: 'safe' as const } : {})
    })
  },
  {
    name: 'help',
    description: 'List commands, aliases, and keyboard shortcuts.',
    aliases: ['?'],
    usage: '/help',
    execute: async () => ({
      message: 'Command reference loaded.',
      targetSection: 'overview',
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
  }
];
