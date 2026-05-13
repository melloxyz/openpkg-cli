import { describe, expect, it } from 'vitest';
import { clampIndex, getWindowedRows } from './list-view.js';

describe('list-view helpers', () => {
  it('clamps indexes to the available range', () => {
    expect(clampIndex(-2, 4)).toBe(0);
    expect(clampIndex(2, 4)).toBe(2);
    expect(clampIndex(99, 4)).toBe(3);
    expect(clampIndex(0, 0)).toBe(0);
  });

  it('returns the current page when the list is longer than the viewport', () => {
    const values = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const rows = getWindowedRows(values, 4, 3);

    expect(rows).toEqual([
      { value: 'd', index: 3 },
      { value: 'e', index: 4 },
      { value: 'f', index: 5 }
    ]);
  });

  it('keeps the last partial page visible near the end of the list', () => {
    const values = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const rows = getWindowedRows(values, 6, 3);

    expect(rows).toEqual([{ value: 'g', index: 6 }]);
  });
});
