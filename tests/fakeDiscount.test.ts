import { describe, expect, it } from 'vitest';
import { detectFakeDiscount } from '../lib/fakeDiscount';
import type { PricePoint } from '../lib/types';

const DAY = 86400;
const T0 = 1_700_000_000;

/** One point per day; `f(dayIndex)` gives the price. Day `days-1` is "today". */
function series(days: number, f: (d: number) => number): PricePoint[] {
  return Array.from({ length: days }, (_, d) => ({ ts: T0 + d * DAY, value: f(d) }));
}

describe('detectFakeDiscount', () => {
  it('flags a raise-then-drop back to the usual price', () => {
    // 100 for months, raised to 130 in the last 3 weeks, "discounted" to 100 today.
    const pts = series(120, (d) => (d >= 99 && d < 119 ? 130 : 100));
    const r = detectFakeDiscount(pts)!;
    expect(r.suspicious).toBe(true);
    expect(r.peak).toBe(130);
    expect(r.baseline).toBe(100);
    expect(r.discountPct).toBeCloseTo(30 / 130, 5);
  });

  it('does not flag a real drop below the usual price', () => {
    const pts = series(120, (d) => (d >= 99 && d < 119 ? 130 : d === 119 ? 80 : 100));
    expect(detectFakeDiscount(pts)!.suspicious).toBe(false);
  });

  it('does not flag a stable price', () => {
    const pts = series(120, () => 100);
    expect(detectFakeDiscount(pts)!.suspicious).toBe(false);
  });

  it('does not flag a small wobble (<8% claimed discount)', () => {
    const pts = series(120, (d) => (d >= 99 && d < 119 ? 105 : 100));
    expect(detectFakeDiscount(pts)!.suspicious).toBe(false);
  });

  it('does not flag when the price never was raised over the baseline', () => {
    // Baseline 130, a slow fall to 100: a real drop, no raise before it.
    const pts = series(120, (d) => (d < 90 ? 130 : d === 119 ? 100 : 125));
    expect(detectFakeDiscount(pts)!.suspicious).toBe(false);
  });

  it('returns null when there is not enough history for a baseline', () => {
    expect(detectFakeDiscount(series(40, () => 100))).toBeNull();
    expect(detectFakeDiscount([])).toBeNull();
  });

  it('works with gaps (missing days) in the series', () => {
    const pts = series(120, (d) => (d >= 99 && d < 119 ? 130 : 100)).filter((_, i) => i % 3 !== 1);
    pts.push({ ts: T0 + 119 * DAY, value: 100 });
    const uniq = pts.filter((p, i, a) => a.findIndex((q) => q.ts === p.ts) === i);
    expect(detectFakeDiscount(uniq)!.suspicious).toBe(true);
  });
});
