import { describe, expect, it, vi } from 'vitest';
import { createCache, createClient, HttpError } from '../lib/api';

function res(status: number, body: string, headers: Record<string, string> = {}) {
  return new Response(body, { status, headers });
}

describe('createClient', () => {
  it('never runs more than `concurrency` requests at once', async () => {
    let active = 0;
    let peak = 0;
    const fetch = vi.fn(async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return res(200, '{"ok":1}');
    });
    const c = createClient({ fetch, concurrency: 3, sleep: async () => {} });
    const out = await Promise.all(Array.from({ length: 10 }, (_, i) => c.json(`/u${i}`)));
    expect(out).toHaveLength(10);
    expect(peak).toBe(3);
    expect(fetch).toHaveBeenCalledTimes(10);
  });

  it('retries 429 and 5xx with backoff, then succeeds', async () => {
    const sleep = vi.fn(async () => {});
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(res(429, ''))
      .mockResolvedValueOnce(res(503, ''))
      .mockResolvedValueOnce(res(200, '{"a":2}'));
    const c = createClient({ fetch, retries: 2, baseDelayMs: 100, sleep });
    expect(await c.json('/x')).toEqual({ a: 2 });
    expect(sleep.mock.calls.map((a) => a[0])).toEqual([100, 200]);
  });

  it('honours Retry-After seconds on 429', async () => {
    const sleep = vi.fn(async () => {});
    const fetch = vi.fn().mockResolvedValueOnce(res(429, '', { 'Retry-After': '3' })).mockResolvedValueOnce(res(200, '{}'));
    await createClient({ fetch, sleep }).json('/x');
    expect(sleep).toHaveBeenCalledWith(3000);
  });

  it('throws HttpError without retrying on 404/410', async () => {
    const fetch = vi.fn(async () => res(410, ''));
    const c = createClient({ fetch, retries: 3, sleep: async () => {} });
    await expect(c.json('/gone')).rejects.toBeInstanceOf(HttpError);
    await expect(c.json('/gone')).rejects.toMatchObject({ status: 410 });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('gives up after `retries` and throws the last error', async () => {
    const fetch = vi.fn(async () => res(500, ''));
    const c = createClient({ fetch, retries: 2, sleep: async () => {} });
    await expect(c.json('/x')).rejects.toMatchObject({ status: 500 });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('sends Accept json for json() and returns raw text for text()', async () => {
    const fetch = vi.fn(async () => res(200, '<p>hi</p>'));
    const c = createClient({ fetch });
    expect(await c.text('/h')).toBe('<p>hi</p>');
    await c.json('/j').catch(() => {});
    const init = fetch.mock.calls[1][1] as RequestInit;
    expect(new Headers(init.headers).get('Accept')).toContain('application/json');
  });
});

describe('createCache', () => {
  function mem() {
    const m = new Map<string, unknown>();
    return {
      get: async (k: string) => m.get(k) ?? null,
      set: async (k: string, v: unknown) => void m.set(k, v),
      m,
    };
  }

  it('returns a stored value until the TTL expires', async () => {
    let now = 1000;
    const store = mem();
    const cache = createCache<number>(store, 'hist', 500, () => now);
    await cache.set('a', 7);
    expect(await cache.get('a')).toBe(7);
    now = 1499;
    expect(await cache.get('a')).toBe(7);
    now = 1501;
    expect(await cache.get('a')).toBeNull();
  });

  it('getOrLoad loads once and caches', async () => {
    const cache = createCache<number>(mem(), 'x', 1000, () => 0);
    const load = vi.fn(async () => 5);
    expect(await cache.getOrLoad('k', load)).toBe(5);
    expect(await cache.getOrLoad('k', load)).toBe(5);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('namespaces keys', async () => {
    const store = mem();
    await createCache<number>(store, 'ns', 1000, () => 0).set('k', 1);
    expect([...store.m.keys()]).toEqual(['ns:k']);
  });
});
