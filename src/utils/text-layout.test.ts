import { describe, expect, it } from 'vitest';
import { fitText, truncatePath, truncateText } from './text-layout.js';

describe('text layout helpers', () => {
  it('truncates long text without exceeding the requested width', () => {
    expect(truncateText('workspace active and healthy', 12)).toBe('workspace...');
    expect(truncateText('ok', 12)).toBe('ok');
  });

  it('fits text to a fixed column width', () => {
    expect(fitText('pnpm', 6)).toBe('pnpm  ');
    expect(fitText('typescript', 6)).toBe('typ...');
  });

  it('keeps the tail of long paths visible', () => {
    expect(truncatePath('C:/Users/user/Desktop/openpkg/node_modules', 18)).toBe(
      '...kg/node_modules'
    );
  });
});
