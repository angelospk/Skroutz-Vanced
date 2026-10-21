// Skroutz data access for content scripts: same-origin fetches (the page's
// cookies pass Cloudflare) with a global rate limit and a storage cache.
import { browser } from 'wxt/browser';
import { createCache, createClient } from './api';
import { historyStats, mergedSeries, parsePriceGraph } from './history';
import { listingJsonUrl, parseListing, priceGraphUrl, shopsListUrl } from './listing';
import { parseShopsList } from './offers';
import { intervalFor, type RateMessage } from './rate';
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

const send = (msg: RateMessage) => browser.runtime.sendMessage(msg);

// Every request of this tab is spaced locally and also takes a permit from the
// background worker, which spaces requests across all tabs. If the worker does
// not answer, the local spacing still applies.
const client = createClient({
  concurrency: 2,
  minIntervalMs: intervalFor(1),
  retries: 2,
  cooldownMs: 30_000,
  permit: () => send({ type: 'sv:permit' }).then(
    () => undefined,
    () => undefined,
  ),
  onRateLimited: (ms) => {
    void send({ type: 'sv:pause', ms }).catch(() => undefined);
    rateListeners.forEach((fn) => fn(ms));
  },
});

export function setRequestRate(requestsPerSecond: number) {
  client.setMinInterval(intervalFor(requestsPerSecond));
}

const historyCache = createCache<PricePoint[]>(store, 'h', HISTORY_TTL);
const offersCache = createCache<Offer[]>(store, 'o', OFFERS_TTL);

/** Daily lowest market price of a SKU, all periods merged, oldest first. */
export async function getHistory(skuId: number, slug: string, signal?: AbortSignal): Promise<PricePoint[]> {
  // Concurrent callers share one load. If another caller aborted that load,
  // a caller that did not abort loads again instead of failing.
  for (;;) {
    try {
      return await historyCache.getOrLoad(String(skuId), async () =>
        mergedSeries(parsePriceGraph(await client.json(priceGraphUrl(skuId, slug), { signal }))),
      );
    } catch (e) {
      const aborted = e instanceof DOMException && e.name === 'AbortError';
      if (!aborted || signal?.aborted) throw e;
    }
  }
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

export async function getListingPage(pageUrl: string, page: number, signal?: AbortSignal): Promise<ListingPage> {
  return parseListing(await client.json(listingJsonUrl(pageUrl, page), { signal }));
}

/**
 * Run a Skroutz search. The search endpoint answers 410 with a `redirectUrl`
 * to the best category; follow it and return that category's first page.
 */
export async function searchListing(keyphrase: string): Promise<{ page: ListingPage; url: string } | null> {
  const body = (await client.json(`/search.json?keyphrase=${encodeURIComponent(keyphrase)}`, {
    okStatuses: [410],
  })) as { redirectUrl?: string; skus?: unknown } | null;
  if (body?.redirectUrl) {
    const url = new URL(body.redirectUrl, location.origin).href;
    return { page: await getListingPage(url, 1), url };
  }
  if (body?.skus) return { page: parseListing(body), url: `${location.origin}/search?keyphrase=${encodeURIComponent(keyphrase)}` };
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

const MAX_HISTORY_ENTRIES = 4000;

/** Drop expired cache entries and cap the history cache; runs at most once an hour. */
export async function purgeCache(now = Date.now()) {
  const last = (await store.get('purgedAt')) as number | null;
  if (last && now - last < HOUR) return;
  await store.set('purgedAt', now);
  const all = await browser.storage.local.get(null);
  const stale: string[] = [];
  const history: [string, number][] = [];
  for (const [k, v] of Object.entries(all)) {
    const t = (v as { t?: number } | null)?.t;
    if (typeof t !== 'number') continue;
    if (k.startsWith('h:')) {
      if (now - t > HISTORY_TTL) stale.push(k);
      else history.push([k, t]);
    } else if (k.startsWith('o:') && now - t > OFFERS_TTL) stale.push(k);
  }
  if (history.length > MAX_HISTORY_ENTRIES) {
    history.sort((a, b) => a[1] - b[1]);
    stale.push(...history.slice(0, history.length - MAX_HISTORY_ENTRIES).map(([k]) => k));
  }
  if (stale.length) await browser.storage.local.remove(stale);
}
