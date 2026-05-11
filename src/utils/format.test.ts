import { describe, expect, it, vi, afterEach } from 'vitest';
import { formatBytes, formatRelativeDate } from './format.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('format utils', () => {
  it('formats bytes with readable units', () => {
    expect(formatBytes()).toBe('0 B');
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(10 * 1024)).toBe('10 KB');
  });

  it('formats relative date ranges', () => {
    const now = new Date('2026-01-31T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);

    expect(formatRelativeDate()).toBe('Unknown');
    expect(formatRelativeDate(now.toISOString())).toBe('Today');
    expect(formatRelativeDate(new Date(now.getTime() - 86_400_000).toISOString())).toBe(
      '1 day ago'
    );
    expect(formatRelativeDate(new Date(now.getTime() - 10 * 86_400_000).toISOString())).toBe(
      '10 days ago'
    );
    expect(formatRelativeDate(new Date(now.getTime() - 62 * 86_400_000).toISOString())).toBe(
      '2mo ago'
    );
  });
});
