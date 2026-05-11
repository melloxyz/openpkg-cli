import { describe, expect, it } from 'vitest';
import { mapWithConcurrency } from './async.js';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('mapWithConcurrency', () => {
  it('maps values preserving input order', async () => {
    const result = await mapWithConcurrency([3, 1, 2], 2, async (value) => {
      await wait(value * 5);
      return value * 10;
    });

    expect(result).toEqual([30, 10, 20]);
  });

  it('respects concurrency limit', async () => {
    let active = 0;
    let maxActive = 0;

    await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (value) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await wait(5);
      active -= 1;
      return value;
    });

    expect(maxActive).toBeLessThanOrEqual(2);
  });

  it('returns empty list for empty input', async () => {
    const result = await mapWithConcurrency([], 5, async (value: number) => value * 2);
    expect(result).toEqual([]);
  });

  it('propagates mapper failures', async () => {
    await expect(
      mapWithConcurrency([1, 2], 2, async (value) => {
        if (value === 2) {
          throw new Error('boom');
        }
        return value;
      })
    ).rejects.toThrow('boom');
  });
});
