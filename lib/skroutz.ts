// Skroutz data access for content scripts: same-origin fetches (the page's
// cookies pass Cloudflare) with a global rate limit and a storage cache.
import { browser } from 'wxt/browser';
import { createCache, createClient } from './api';
import { historyStats, mergedSeries, parsePriceGraph } from './history';
import { listingJsonUrl, parseListing, priceGraphUrl, shopsListUrl } from './listing';
import { parseShopsList } from './offers';
import { PERIOD_DAYS } from './settings';
import type { HistoryStats, ListingPage, Offer, Period, PricePoint } from './types';

const HOUR = 3600_000;
const DAY_S = 86400;
const HISTORY_TTL = 12 * HOUR;
const OFFERS_TTL = 1 * HOUR;

const store = {
  get: async (k: string) => (await browser.storage.local.get(k))[k] ?? null,
  set: async (k: string, v: unknown) => {
    await browser.storage.local.set({ [k]: v });
  },
};

type RateListener = (pauseMs: number) => void;
const rateListeners = new Set<RateListener>();

/** Subscribe to "Skroutz rate-limited us" events. Returns an unsubscribe function. */
export function onRateLimited(fn: RateListener): () => void {
  rateListeners.add(fn);
  return () => rateListeners.delete(fn);
}

function makeClient(requestsPerSecond: number) {
  const rps = Math.max(0.2, Math.min(4, requestsPerSecond));
  return createClient({
    concurrency: 2,
    minIntervalMs: 1000 / rps,
    retries: 2,
    cooldownMs: 30_000,
    onRateLimited: (ms) => rateListeners.forEach((fn) => fn(ms)),
  });
}

let client = makeClient(1);
let currentRate = 1;

/** One client per tab: every request of the tab shares its rate limit. */
export function setRequestRate(requestsPerSecond: number) {
  if (requestsPerSecond === currentRate) return;
  currentRate = requestsPerSecond;
  client = makeClient(requestsPerSecond);
}

const historyCache = createCache<PricePoint[]>(store, 'h', HISTORY_TTL);
const offersCache = createCache<Offer[]>(store, 'o', OFFERS_TTL);

/** Daily lowest market price of a SKU, all periods merged, oldest first. */
export function getHistory(skuId: number, slug: string): Promise<PricePoint[]> {
  return historyCache.getOrLoad(String(skuId), async () =>
    mergedSeries(parsePriceGraph(await client.json(priceGraphUrl(skuId, slug)))),
  );
}

/** Stats over the last `period` of the series (counted back from its newest point). */
export function statsFor(points: PricePoint[], period: Period): HistoryStats | null {
  if (points.length === 0) return null;
  const cutoff = points[points.length - 1].ts - PERIOD_DAYS[period] * DAY_S;
  return historyStats(points.filter((p) => p.ts >= cutoff));
}

/** Lowest price across all shops on the newest day of the series. */
export function marketMinNow(points: PricePoint[]): number | null {
  return points.length ? points[points.length - 1].value : null;
}

export function getOffers(skuId: number): Promise<Offer[]> {
  return offersCache.getOrLoad(String(skuId), async () => parseShopsList(await client.text(shopsListUrl(skuId))));
}

export async function getListingPage(pageUrl: string, page: number): Promise<ListingPage> {
  return parseListing(await client.json(listingJsonUrl(pageUrl, page)));
}

/**
 * Run a Skroutz search. The search endpoint answers 410 with a `redirectUrl`
 * to the best category; follow it and return that category's first page.
 */
export async function searchListing(keyphrase: string): Promise<{ page: ListingPage; url: string } | null> {
  const res = await fetch(`/search.json?keyphrase=${encodeURIComponent(keyphrase)}`, {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });
  let body: { redirectUrl?: string; skus?: unknown } | null = null;
  try {
    body = await res.json();
  } catch {
    return null;
  }
  if (body?.redirectUrl) {
    const url = new URL(body.redirectUrl, location.origin).href;
    return { page: await getListingPage(url, 1), url };
  }
  if (body?.skus) return { page: parseListing(body), url: location.origin + '/search.html?keyphrase=' + keyphrase };
  return null;
}

export interface CartItemRef {
  lineId: string;
  skuId: number;
  productId: number;
  quantity: number;
}

export async function getCartItems(): Promise<CartItemRef[]> {
  const data = (await client.json('/cart.json')) as {
    cart?: { line_items?: Record<string, { sku_id: number; product_id: number; quantity: number; selected?: boolean }> };
  };
  return Object.entries(data?.cart?.line_items ?? {})
    .filter(([, l]) => l.selected !== false)
    .map(([lineId, l]) => ({ lineId, skuId: l.sku_id, productId: l.product_id, quantity: l.quantity }));
}

/** Drop expired cache entries; runs at most once a day. */
export async function purgeCache(now = Date.now()) {
  const last = (await store.get('purgedAt')) as number | null;
  if (last && now - last < 24 * HOUR) return;
  const all = await browser.storage.local.get(null);
  const stale = Object.entries(all)
    .filter(([k, v]) => {
      const t = (v as { t?: number } | null)?.t;
      if (typeof t !== 'number') return false;
      if (k.startsWith('h:')) return now - t > HISTORY_TTL;
      if (k.startsWith('o:')) return now - t > OFFERS_TTL;
      return false;
    })
    .map(([k]) => k);
  if (stale.length) await browser.storage.local.remove(stale);
  await store.set('purgedAt', now);
}
