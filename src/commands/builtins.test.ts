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
    expect(names).toEqual([
      'scan',
      'doctor',
      'updates',
      'projects',
      'cache',
      'cleanup',
      'help',
      'settings'
    ]);
  });

  it('publishes completion hints for scope and flags', () => {
    const scan = getCommand('scan');
    const cleanup = getCommand('cleanup');

    expect(scan.completion?.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'argument', value: 'workspace' }),
        expect.objectContaining({ kind: 'flag', value: '--scope' }),
        expect.objectContaining({ kind: 'flag', value: '--cached' })
      ])
    );
    expect(cleanup.completion?.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'flag', value: '--dry-run' }),
        expect.objectContaining({ kind: 'flag', value: '--delete-safe' }),
        expect.objectContaining({ kind: 'flag', value: '--confirm' })
      ])
    );
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
      updateFetchPolicy: 'force',
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

  it('previews safe cleanup targets when --delete-safe is not confirmed', async () => {
    const cleanup = getCommand('cleanup');
    const result = await cleanup.execute(
      baseParsed({
        name: 'cleanup',
        raw: '/cleanup --delete-safe',
        options: { 'delete-safe': true }
      }),
      commandContext
    );

    expect(result.cleanupDryRun).toBe(true);
    expect(result.cleanupDeletionMode).toBeUndefined();
    expect(result.message).toContain('Previewing safe cleanup candidates');
  });

  it('sets cleanupDeletionMode to safe only when --delete-safe is confirmed', async () => {
    const cleanup = getCommand('cleanup');
    const result = await cleanup.execute(
      baseParsed({
        name: 'cleanup',
        raw: '/cleanup workspace --delete-safe --confirm',
        args: ['workspace'],
        options: { 'delete-safe': true, confirm: true }
      }),
      commandContext
    );

    expect(result.cleanupDeletionMode).toBe('safe');
    expect(result.cleanupDryRun).toBeUndefined();
    expect(result.scope).toBe('workspace');
    expect(result.message).toContain('Deleting confirmed safe cleanup candidates');
  });

  it('supports an explicit cleanup dry-run flag', async () => {
    const cleanup = getCommand('cleanup');
    const result = await cleanup.execute(
      baseParsed({
        name: 'cleanup',
        raw: '/cleanup machine --dry-run',
        args: ['machine'],
        options: { 'dry-run': true }
      }),
      commandContext
    );

    expect(result.cleanupDryRun).toBe(true);
    expect(result.cleanupDeletionMode).toBeUndefined();
    expect(result.scope).toBe('machine');
  });

  it('returns help and settings command payloads', async () => {
    const help = getCommand('help');
    const settings = getCommand('settings');
    const updates = getCommand('updates');

    const [helpResult, settingsResult, updatesResult] = await Promise.all([
      help.execute(baseParsed({ name: 'help', raw: '/help' }), commandContext),
      settings.execute(baseParsed({ name: 'settings', raw: '/settings' }), commandContext),
      updates.execute(
        baseParsed({
          name: 'updates',
          raw: '/updates --force',
          options: { force: true }
        }),
        commandContext
      )
    ]);

    expect(helpResult).toMatchObject({
      showHelp: true,
      targetSection: 'overview'
    });
    expect(settingsResult).toMatchObject({
      targetSection: 'settings'
    });
    expect(updatesResult).toMatchObject({
      targetSection: 'doctor',
      triggerDoctorScan: true,
      updatesOnly: true,
      updateFetchPolicy: 'force'
    });
  });

  it('uses cache-only update policy when --cached is provided to doctor or updates', async () => {
    const doctor = getCommand('doctor');
    const updates = getCommand('updates');

    const [doctorResult, updatesResult] = await Promise.all([
      doctor.execute(
        baseParsed({
          name: 'doctor',
          raw: '/doctor --cached',
          options: { cached: true }
        }),
        commandContext
      ),
      updates.execute(
        baseParsed({
          name: 'updates',
          raw: '/updates --cached',
          options: { cached: true }
        }),
        commandContext
      )
    ]);

    expect(doctorResult).toMatchObject({
      cachePolicy: 'prefer-cache',
      updateFetchPolicy: 'cache-only'
    });
    expect(updatesResult).toMatchObject({
      cachePolicy: 'prefer-cache',
      updateFetchPolicy: 'cache-only'
    });
  });
});
