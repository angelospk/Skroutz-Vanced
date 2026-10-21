import { closeness } from './history';
import type { HistoryStats, ListingItem } from './types';

export type DealRow = {
  item: ListingItem;
  stats: HistoryStats | null;
  marketMin: number | null;
  fake: boolean;
};

export interface DealScore {
  historyCloseness: number | null;
  marketGapPct: number | null;
}

export function scoreRow(row: DealRow): DealScore {
  const price = row.item.price;
  const historyCloseness =
    price !== null && row.stats ? closeness(price, row.stats.min, row.stats.median) : null;
  const marketGapPct =
    price !== null && row.marketMin !== null && row.marketMin > 0
      ? Math.max(0, (price - row.marketMin) / row.marketMin)
      : null;
  return { historyCloseness, marketGapPct };
}

export interface DealFilter {
  maxMarketGapPct?: number;
  minHistoryCloseness?: number;
  hideFake?: boolean;
  sort?: 'history' | 'market' | 'price';
}

export function filterDeals(rows: DealRow[], f: DealFilter): DealRow[] {
  const sort = f.sort ?? 'history';
  const scored = rows
    .map((row) => ({ row, ...scoreRow(row) }))
    .filter((r) => {
      if (f.hideFake && r.row.fake) return false;
      if (f.maxMarketGapPct !== undefined && (r.marketGapPct === null || r.marketGapPct > f.maxMarketGapPct)) return false;
      if (f.minHistoryCloseness !== undefined && (r.historyCloseness === null || r.historyCloseness < f.minHistoryCloseness)) return false;
      return true;
    });
  const key = (r: (typeof scored)[number]): number | null =>
    sort === 'history'
      ? r.historyCloseness === null ? null : -r.historyCloseness
      : sort === 'market'
        ? r.marketGapPct
        : r.row.item.price;
  // Array.prototype.sort is stable.
  scored.sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    if (ka === null && kb === null) return 0;
    if (ka === null) return 1;
    if (kb === null) return -1;
    return ka - kb;
  });
  return scored.map((r) => r.row);
}
