import { describe, expect, it } from 'vitest';
import { CommandRegistry } from './registry.js';
import type { CommandDefinition } from '../types/index.js';

const createCommand = (name: string, aliases: string[] = []): CommandDefinition => ({
  name,
  aliases,
  description: `${name} description`,
  execute: () => ({ message: `${name} executed` })
});

describe('CommandRegistry', () => {
  it('registers commands and lists them', () => {
    const registry = new CommandRegistry();
    const scan = createCommand('scan');
    const doctor = createCommand('doctor');

    registry.register(scan);
    registry.register(doctor);

    expect(registry.getAll()).toEqual([scan, doctor]);
  });

  it('resolves commands by name or alias in a case-insensitive way', () => {
    const registry = new CommandRegistry();
    const command = createCommand('doctor', ['diag', 'health']);
    registry.register(command);

    expect(registry.resolve('/DOCTOR')).toEqual(command);
    expect(registry.resolve('/DiAg')).toEqual(command);
    expect(registry.resolve('/missing')).toBeUndefined();
  });

  it('returns all commands as low-score suggestions for empty input', () => {
    const registry = new CommandRegistry();
    registry.register(createCommand('scan'));
    registry.register(createCommand('doctor'));

    const suggestions = registry.getSuggestions('   ');

    expect(suggestions).toHaveLength(2);
    expect(suggestions.every((entry) => entry.score === 1)).toBe(true);
  });

  it('prioritizes exact, alias and fuzzy matches and limits to top 6', () => {
    const registry = new CommandRegistry();
    const scan = createCommand('scan', ['rescan']);
    const doctor = createCommand('doctor', ['diag']);

    [scan, doctor, 'settings', 'projects', 'cleanup', 'cache', 'help', 'status'].forEach(
      (command) => {
        registry.register(typeof command === 'string' ? createCommand(command) : command);
      }
    );

    const exact = registry.getSuggestions('scan');
    expect(exact[0]?.definition.name).toBe('scan');
    expect(exact[0]?.matchedBy).toBe('name');

    const alias = registry.getSuggestions('diag');
    expect(alias[0]?.definition.name).toBe('doctor');
    expect(alias[0]?.matchedBy).toBe('alias');

    const fuzzy = registry.getSuggestions('c');
    expect(fuzzy.length).toBeGreaterThan(0);
    expect(fuzzy.length).toBeLessThanOrEqual(6);
    expect(fuzzy.some((entry) => entry.matchedBy === 'fuzzy')).toBe(true);
  });

  it('parses input via parser integration', () => {
    const registry = new CommandRegistry();
    const parsed = registry.parse('/scan workspace --limit=3 --cached');

    expect(parsed).toEqual({
      name: 'scan',
      raw: '/scan workspace --limit=3 --cached',
      args: ['workspace'],
      options: {
        limit: 3,
        cached: true
      }
    });
  });

  it('builds palette suggestions for command names, flags, and scoped values', () => {
    const registry = new CommandRegistry();
    registry.register(createCommand('scan', ['rescan']));
    registry.register(createCommand('cleanup', ['clean']));

    const scanCommand = registry.getPaletteSuggestions('/sc');
    expect(scanCommand[0]).toMatchObject({
      kind: 'command',
      label: '/scan',
      insertText: '/scan'
    });

    const scanFlags = createCommand('scan', ['rescan']);
    scanFlags.completion = {
      entries: [
        {
          kind: 'flag',
          value: '--scope',
          description: 'Set the scan scope.',
          values: ['workspace', 'developer-home', 'machine']
        },
        {
          kind: 'flag',
          value: '--cached',
          description: 'Use cached scan data.'
        }
      ]
    };

    const completionRegistry = new CommandRegistry();
    completionRegistry.register(scanFlags);

    const flagSuggestions = completionRegistry.getPaletteSuggestions('/scan --sc');
    expect(flagSuggestions[0]).toMatchObject({
      kind: 'flag',
      label: '--scope=',
      insertText: '--scope='
    });

    const valueSuggestions = completionRegistry.getPaletteSuggestions('/scan --scope=de');
    expect(valueSuggestions[0]).toMatchObject({
      kind: 'flag',
      label: 'developer-home',
      insertText: '--scope=developer-home'
    });
  });

  it('does not replace unknown argument tokens with command suggestions', () => {
    const scanCommand = createCommand('scan');
    scanCommand.completion = {
      entries: [
        {
          kind: 'flag',
          value: '--cached',
          description: 'Use cached scan data.'
        }
      ]
    };

    const registry = new CommandRegistry();
    registry.register(scanCommand);

    expect(registry.getPaletteSuggestions('/scan --bogus')).toEqual([]);
  });
});
