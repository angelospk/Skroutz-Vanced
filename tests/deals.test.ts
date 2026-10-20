import { describe, expect, it } from 'vitest';
import { filterDeals, scoreRow, type DealRow } from '../lib/deals';
import type { HistoryStats, ListingItem } from '../lib/types';

function row(skuId: number, price: number, stats: Partial<HistoryStats> | null, marketMin: number | null, fake = false): DealRow {
  const item: ListingItem = {
    skuId,
    name: `item ${skuId}`,
    slug: 'x',
    url: `/s/${skuId}/x.html`,
    price,
    reviewScore: 4.5,
    reviewsCount: 10,
    categoryId: 1,
    sponsored: false,
    imageUrl: null,
  };
  const full = stats && { min: 0, max: 0, mean: 0, median: 0, current: 0, minTs: 0, count: 30, ...stats };
  return { item, stats: full, marketMin, fake };
}

describe('scoreRow', () => {
  it('scores closeness to the historic low and the gap to the market low', () => {
    const s = scoreRow(row(1, 110, { min: 100, median: 120 }, 100));
    expect(s.historyCloseness).toBeCloseTo(0.5);
    expect(s.marketGapPct).toBeCloseTo(0.1);
  });
  it('gives nulls when data is missing', () => {
    const s = scoreRow(row(1, 110, null, null));
    expect(s.historyCloseness).toBeNull();
    expect(s.marketGapPct).toBeNull();
  });
  it('a price under the market low gives a 0 gap, not negative', () => {
    expect(scoreRow(row(1, 95, null, 100)).marketGapPct).toBe(0);
  });
});

describe('filterDeals', () => {
  const rows = [
    row(1, 100, { min: 100, median: 120 }, 100), // at historic low, cheapest in market
    row(2, 110, { min: 100, median: 120 }, 100), // half way, 10% over market
    row(3, 119, { min: 100, median: 120 }, 119, true), // near typical, cheapest, fake
    row(4, 50, null, null), // no data
  ];

  it('sorts by history closeness by default, rows without data last', () => {
    expect(filterDeals(rows, {}).map((r) => r.item.skuId)).toEqual([1, 2, 3, 4]);
  });

  it('filters by max market gap', () => {
    expect(filterDeals(rows, { maxMarketGapPct: 0.05 }).map((r) => r.item.skuId)).toEqual([1, 3]);
  });

  it('filters by min history closeness', () => {
    expect(filterDeals(rows, { minHistoryCloseness: 0.4 }).map((r) => r.item.skuId)).toEqual([1, 2]);
  });

  it('can hide fake discounts', () => {
    expect(filterDeals(rows, { hideFake: true }).map((r) => r.item.skuId)).toEqual([1, 2, 4]);
  });

  it('can sort by market gap and by price', () => {
    expect(filterDeals(rows, { sort: 'market' }).map((r) => r.item.skuId)).toEqual([1, 3, 2, 4]);
    expect(filterDeals(rows, { sort: 'price' }).map((r) => r.item.skuId)).toEqual([4, 1, 2, 3]);
  });

  it('does not mutate the input', () => {
    const copy = rows.map((r) => r.item.skuId);
    filterDeals(rows, { sort: 'price' });
    expect(rows.map((r) => r.item.skuId)).toEqual(copy);
  });
});
