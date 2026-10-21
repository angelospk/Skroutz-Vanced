import type { PricePoint } from './types';

const DAY = 86400;

export interface FakeDiscountResult {
  suspicious: boolean;
  peak: number;
  baseline: number;
  discountPct: number;
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2]! : (s[n / 2 - 1]! + s[n / 2]!) / 2;
}

/**
 * A "discount" is suspicious when the price was raised well above its usual
 * level in the last month and the current price is merely back at that usual level.
 */
export function detectFakeDiscount(points: PricePoint[]): FakeDiscountResult | null {
  const last = points.at(-1);
  if (!last) return null;
  const base = points.filter((p) => p.ts >= last.ts - 90 * DAY && p.ts <= last.ts - 30 * DAY);
  if (base.length < 14) return null;
  const baseline = median(base.map((p) => p.value));
  const recent = points.filter((p) => p.ts > last.ts - 30 * DAY && p.ts < last.ts);
  const current = last.value;
  const peak = recent.length ? Math.max(...recent.map((p) => p.value)) : current;
  const discountPct = peak > 0 ? (peak - current) / peak : 0;
  const suspicious = discountPct >= 0.08 && peak >= baseline * 1.08 && current >= baseline * 0.98;
  return { suspicious, peak, baseline, discountPct };
}
