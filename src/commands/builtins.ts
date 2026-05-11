import type { CommandDefinition } from '../types/index.js';

export const createBuiltInCommands = (): CommandDefinition[] => [
  {
    name: 'scan',
    description: 'Run project and cache discovery across your developer roots.',
    aliases: ['rescan', 'refresh'],
    usage: '/scan [--scope=workspace]',
    execute: async () => ({
      message: 'Started a full environment scan.',
      targetSection: 'overview',
      triggerProjectScan: true,
      triggerCleanupScan: true,
      triggerDoctorScan: true
    })
  },
  {
    name: 'doctor',
    description: 'Check runtime availability and environment health.',
    aliases: ['diag', 'health'],
    usage: '/doctor',
    execute: async () => ({
      message: 'Running environment diagnostics.',
      targetSection: 'doctor',
      triggerDoctorScan: true
    })
  },
  {
    name: 'projects',
    description: 'Open the project inventory and trigger project discovery.',
    aliases: ['repos', 'apps'],
    usage: '/projects',
    execute: async () => ({
      message: 'Loading local projects.',
      targetSection: 'projects',
      triggerProjectScan: true
    })
  },
  {
    name: 'cache',
    description: 'Inspect cache-heavy directories and build artifacts.',
    aliases: ['caches'],
    usage: '/cache',
    execute: async () => ({
      message: 'Scanning cache and artifact directories.',
      targetSection: 'cache',
      triggerCleanupScan: true
    })
  },
  {
    name: 'cleanup',
    description: 'Review safe cleanup candidates across your machine.',
    aliases: ['clean'],
    usage: '/cleanup',
    execute: async () => ({
      message: 'Preparing cleanup candidates.',
      targetSection: 'cleanup',
      triggerCleanupScan: true
    })
  },
  {
    name: 'help',
    description: 'List commands, aliases, and keyboard shortcuts.',
    aliases: ['?'],
    usage: '/help',
    execute: async () => ({
      message: 'Slash commands are ready. Use /scan, /projects, /cleanup, or /doctor.',
      targetSection: 'overview'
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
