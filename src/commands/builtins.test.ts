import { describe, expect, it } from 'vitest';
import { createBuiltInCommands } from './builtins.js';
import type { ParsedCommand } from '../types/index.js';

const getCommand = (name: string) => {
  const command = createBuiltInCommands().find((entry) => entry.name === name);
  expect(command).toBeDefined();
  return command!;
};

const baseParsed = (overrides: Partial<ParsedCommand> = {}): ParsedCommand => ({
  name: 'scan',
  raw: '/scan',
  args: [],
  options: {},
  ...overrides
});
const commandContext = {
  cwd: 'C:\\workspace',
  homeDir: 'C:\\Users\\user'
};

describe('createBuiltInCommands', () => {
  it('returns the expected built-in command set', () => {
    const names = createBuiltInCommands().map((command) => command.name);
    expect(names).toEqual(['scan', 'doctor', 'projects', 'cache', 'cleanup', 'help', 'settings']);
  });

  it('resolves scan command scope and cache policy', async () => {
    const scan = getCommand('scan');
    const result = await scan.execute(
      baseParsed({
        options: { force: true, scope: 'machine' }
      }),
      commandContext
    );

    expect(result).toMatchObject({
      targetSection: 'overview',
      triggerProjectScan: true,
      triggerCleanupScan: true,
      triggerDoctorScan: true,
      cachePolicy: 'force',
      scope: 'machine'
    });
  });

  it('uses positional scope and prefer-cache policy when cached is true', async () => {
    const projects = getCommand('projects');
    const result = await projects.execute(
      baseParsed({
        name: 'projects',
        raw: '/projects workspace --cached',
        args: ['workspace'],
        options: { cached: true }
      }),
      commandContext
    );

    expect(result).toMatchObject({
      targetSection: 'projects',
      triggerProjectScan: true,
      cachePolicy: 'prefer-cache',
      scope: 'workspace'
    });
  });

  it('falls back to developer-home scope for invalid scope values', async () => {
    const cache = getCommand('cache');
    const result = await cache.execute(
      baseParsed({
        name: 'cache',
        raw: '/cache --scope=invalid',
        options: { scope: 'invalid' }
      }),
      commandContext
    );

    expect(result.scope).toBe('developer-home');
  });

  it('sets cleanupDeletionMode to safe when --delete-safe is provided', async () => {
    const cleanup = getCommand('cleanup');
    const result = await cleanup.execute(
      baseParsed({
        name: 'cleanup',
        raw: '/cleanup --delete-safe',
        options: { 'delete-safe': true }
      }),
      commandContext
    );

    expect(result.cleanupDeletionMode).toBe('safe');
    expect(result.message).toContain('Deleting safe cleanup candidates');
  });

  it('returns help and settings command payloads', async () => {
    const help = getCommand('help');
    const settings = getCommand('settings');

    const [helpResult, settingsResult] = await Promise.all([
      help.execute(baseParsed({ name: 'help', raw: '/help' }), commandContext),
      settings.execute(baseParsed({ name: 'settings', raw: '/settings' }), commandContext)
    ]);

    expect(helpResult).toMatchObject({
      showHelp: true,
      targetSection: 'overview'
    });
    expect(settingsResult).toMatchObject({
      targetSection: 'settings'
    });
  });
});
