import { describe, expect, it } from 'vitest';
import graph from './fixtures/price_graph_a56.json';
import { parsePrice } from '../lib/price';
import { closeness, historyStats, mergedSeries, parsePriceGraph } from '../lib/history';

describe('parsePrice', () => {
  it.each([
    ['14,70 €', 14.7],
    ['1.007,45 €', 1007.45],
    ['1.234.567,89 €', 1234567.89],
    ['από 365,00 €', 365],
    ['2,50 €', 2.5],
    ['370 €', 370],
    ['Δωρεάν', 0],
    [' δωρεάν ', 0],
  ])('%s -> %d', (input, out) => {
    expect(parsePrice(input)).toBeCloseTo(out, 5);
  });

  it.each(['', 'abc', '€', null, undefined])('%s -> null', (input) => {
    expect(parsePrice(input as string)).toBeNull();
  });

  it('rejects non-ASCII digits', () => {
    expect(parsePrice('١٢,٣٠ €')).toBeNull();
  });
});

describe('parsePriceGraph', () => {
  const series = parsePriceGraph(graph);

  it('reads every period and drops zero (no data) points', () => {
    expect(series['1_months']).toHaveLength(30);
    expect(series['all']).toHaveLength(399);
    expect(series['all'].every((p) => p.value > 0)).toBe(true);
  });

  it('keeps points sorted by time', () => {
    const ts = series['all'].map((p) => p.ts);
    expect([...ts].sort((a, b) => a - b)).toEqual(ts);
  });

  it('returns empty series for a malformed response', () => {
    expect(parsePriceGraph({})['all']).toEqual([]);
    expect(parsePriceGraph(null)['1_months']).toEqual([]);
  });
});

describe('mergedSeries', () => {
  it('merges all periods into one daily series ending at the newest point', () => {
    const merged = mergedSeries(parsePriceGraph(graph));
    // `all` ends earlier than `1_months`; the merge must reach the newest day.
    expect(merged.at(-1)).toEqual({ ts: 1792530000, value: 365 });
    const ts = merged.map((p) => p.ts);
    expect(new Set(ts).size).toBe(ts.length);
    expect([...ts].sort((a, b) => a - b)).toEqual(ts);
    expect(Math.min(...merged.map((p) => p.value))).toBe(250.29);
  });
});

describe('historyStats', () => {
  it('computes stats of the 1-month series', () => {
    const s = historyStats(parsePriceGraph(graph)['1_months'])!;
    expect(s.min).toBe(315.54);
    expect(s.max).toBe(365);
    expect(s.current).toBe(365);
    expect(s.median).toBe(337.5);
    expect(s.mean).toBeCloseTo(339.4933, 3);
    expect(s.count).toBe(30);
  });

  it('minTs is the newest timestamp at the minimum', () => {
    const s = historyStats([
      { ts: 1, value: 5 },
      { ts: 2, value: 9 },
      { ts: 3, value: 5 },
      { ts: 4, value: 7 },
    ])!;
    expect(s.minTs).toBe(3);
    expect(s.median).toBe(6);
  });

  it('returns null for an empty series', () => {
    expect(historyStats([])).toBeNull();
  });
});

describe('closeness', () => {
  it('is 1 at or under the low reference', () => {
    expect(closeness(100, 100, 150)).toBe(1);
    expect(closeness(90, 100, 150)).toBe(1);
  });
  it('is 0 at or over the high reference', () => {
    expect(closeness(150, 100, 150)).toBe(0);
    expect(closeness(200, 100, 150)).toBe(0);
  });
  it('is linear between', () => {
    expect(closeness(125, 100, 150)).toBeCloseTo(0.5);
  });
  it('handles low == high', () => {
    expect(closeness(100, 100, 100)).toBe(1);
    expect(closeness(101, 100, 100)).toBe(0);
  });
});
