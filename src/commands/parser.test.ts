import { describe, expect, it } from 'vitest';
import { parseCommandInput } from './parser.js';

describe('parseCommandInput', () => {
  it('parses args and options from a slash command', () => {
    const result = parseCommandInput('/scan workspace --limit=20 --dry-run');

    expect(result).toEqual({
      name: 'scan',
      raw: '/scan workspace --limit=20 --dry-run',
      args: ['workspace'],
      options: {
        limit: 20,
        'dry-run': true
      }
    });
  });

  it('supports plain commands without slash and trims input', () => {
    const result = parseCommandInput('   projects workspace --cached   ');

    expect(result).toEqual({
      name: 'projects',
      raw: '   projects workspace --cached   ',
      args: ['workspace'],
      options: {
        cached: true
      }
    });
  });

  it('coerces boolean and numeric option values', () => {
    const result = parseCommandInput('/scan --enabled=true --retry=false --limit=42 --name=alpha');

    expect(result.options).toEqual({
      enabled: true,
      retry: false,
      limit: 42,
      name: 'alpha'
    });
  });

  it('ignores malformed options without a key', () => {
    const result = parseCommandInput('/scan --=20 --force');

    expect(result.options).toEqual({
      force: true
    });
  });
});
