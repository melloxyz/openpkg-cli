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
});
