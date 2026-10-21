import type { Period, PricePoint, HistoryStats } from './types';

const PERIODS: Period[] = ['1_months', '3_months', '6_months', 'all'];

/** Read every period of a `price_graph` response. Zero values mean "no data" and are dropped. */
export function parsePriceGraph(json: unknown): Record<Period, PricePoint[]> {
  const out = {} as Record<Period, PricePoint[]>;
  const data = (json as any)?.min_price?.graphData;
  for (const period of PERIODS) {
    const values = data?.[period]?.values;
    const pts: PricePoint[] = [];
    if (Array.isArray(values)) {
      for (const v of values) {
        const ts = Number(v?.timestamp);
        const value = Number(v?.value);
        if (Number.isFinite(ts) && Number.isFinite(value) && value > 0) pts.push({ ts, value });
      }
    }
    pts.sort((a, b) => a.ts - b.ts);
    out[period] = pts;
  }
  return out;
}

/** Union of all periods, one point per timestamp, oldest first. */
export function mergedSeries(series: Record<Period, PricePoint[]>): PricePoint[] {
  const byTs = new Map<number, PricePoint>();
  for (const period of PERIODS) {
    for (const p of series[period] ?? []) if (!byTs.has(p.ts)) byTs.set(p.ts, p);
  }
  return [...byTs.values()].sort((a, b) => a.ts - b.ts);
}

export function historyStats(points: PricePoint[]): HistoryStats | null {
  if (points.length === 0) return null;
  const values = points.map((p) => p.value);
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const min = sorted[0]!;
  const max = sorted[n - 1]!;
  const median = n % 2 ? sorted[(n - 1) / 2]! : (sorted[n / 2 - 1]! + sorted[n / 2]!) / 2;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  let minTs = points[0]!.ts;
  for (const p of points) if (p.value === min && p.ts >= minTs) minTs = p.ts;
  return { min, max, mean, median, current: points[points.length - 1]!.value, minTs, count: n };
}

/** 1 when `price` is at or under `low`, 0 at or over `high`, linear between. */
export function closeness(price: number, low: number, high: number): number {
  if (low >= high) return price <= low ? 1 : 0;
  if (price <= low) return 1;
  if (price >= high) return 0;
  return (high - price) / (high - low);
}
