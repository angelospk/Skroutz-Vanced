import { describe, expect, it } from 'vitest';
import { intervalFor } from '../lib/rate';

describe('intervalFor', () => {
  it.each([
    [1, 1000],
    [2, 1000], // clamped to 1/s (Cloudflare 1015 near 1.7/s)
    [0.5, 2000],
    [100, 1000], // clamped to 1/s
    [0, 5000], // clamped to 0.2/s
    [NaN, 1000],
  ])('%d req/s -> %d ms', (rps, ms) => {
    expect(intervalFor(rps)).toBe(ms);
  });
});
