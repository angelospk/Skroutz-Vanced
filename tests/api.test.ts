import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
    vi.useFakeTimers({ now: 0 });
    try {
      const starts: number[] = [];
      const replies = [res(429, ''), res(503, ''), res(200, '{"a":2}')];
      const fetch = vi.fn(async () => {
        starts.push(Date.now());
        return replies.shift()!;
      });
      const c = createClient({ fetch, retries: 2, baseDelayMs: 100 });
      const p = c.json('/x');
      await vi.runAllTimersAsync();
      expect(await p).toEqual({ a: 2 });
      // 429: pause cooldownMs (defaults to baseDelayMs); 503: backoff baseDelayMs * 2^1
      expect(starts).toEqual([0, 100, 300]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('honours Retry-After seconds on 429', async () => {
    vi.useFakeTimers({ now: 0 });
    try {
      const starts: number[] = [];
      const replies = [res(429, '', { 'Retry-After': '3' }), res(200, '{}')];
      const fetch = vi.fn(async () => {
        starts.push(Date.now());
        return replies.shift()!;
      });
      const p = createClient({ fetch }).json('/x');
      await vi.runAllTimersAsync();
      await p;
      expect(starts).toEqual([0, 3000]);
    } finally {
      vi.useRealTimers();
    }
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
    const fetch = vi.fn(async (_url: string, _init?: RequestInit) => res(200, '<p>hi</p>'));
    const c = createClient({ fetch });
    expect(await c.text('/h')).toBe('<p>hi</p>');
    await c.json('/j').catch(() => {});
    const init = fetch.mock.calls[1]![1] as RequestInit;
    expect(new Headers(init.headers).get('Accept')).toContain('application/json');
  });
});

describe('createClient rate limiting', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: 0 });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  async function run<T>(p: Promise<T>): Promise<T> {
    await vi.runAllTimersAsync();
    return p;
  }

  it('spaces request starts by minIntervalMs', async () => {
    const starts: number[] = [];
    const fetch = vi.fn(async () => {
      starts.push(Date.now());
      return res(200, '{}');
    });
    const c = createClient({ fetch, concurrency: 4, minIntervalMs: 1000 });
    await run(Promise.all([c.json('/a'), c.json('/b'), c.json('/c')]));
    expect(starts).toEqual([0, 1000, 2000]);
  });

  it('a 429 pauses every request until Retry-After, and reports it', async () => {
    const starts: Record<string, number[]> = {};
    let first = true;
    const fetch = vi.fn(async (url: string) => {
      (starts[url] ??= []).push(Date.now());
      if (url === '/a' && first) {
        first = false;
        return res(429, '', { 'Retry-After': '5' });
      }
      return res(200, '{}');
    });
    const onRateLimited = vi.fn();
    const c = createClient({ fetch, concurrency: 1, onRateLimited });
    await run(Promise.all([c.json('/a'), c.json('/b')]));
    expect(onRateLimited).toHaveBeenCalledWith(5000);
    expect(starts['/a']![1]).toBeGreaterThanOrEqual(5000);
    expect(starts['/b']![0]).toBeGreaterThanOrEqual(5000);
  });

  it('without Retry-After a 429 pauses for cooldownMs, doubling on repeats', async () => {
    const starts: number[] = [];
    const fetch = vi.fn(async () => {
      starts.push(Date.now());
      return starts.length <= 2 ? res(429, '') : res(200, '{}');
    });
    const c = createClient({ fetch, retries: 2, cooldownMs: 10_000 });
    await run(c.json('/x'));
    expect(starts).toEqual([0, 10_000, 30_000]);
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

  it('getOrLoad shares one load between concurrent callers', async () => {
    const cache = createCache<number>(mem(), 'x', 1000, () => 0);
    let resolve!: (v: number) => void;
    const load = vi.fn(() => new Promise<number>((r) => (resolve = r)));
    const a = cache.getOrLoad('k', load);
    const b = cache.getOrLoad('k', load);
    await new Promise((r) => setTimeout(r, 0));
    resolve(9);
    expect(await Promise.all([a, b])).toEqual([9, 9]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('getOrLoad does not cache a failed load', async () => {
    const cache = createCache<number>(mem(), 'x', 1000, () => 0);
    await expect(cache.getOrLoad('k', async () => { throw new Error('boom'); })).rejects.toThrow('boom');
    expect(await cache.getOrLoad('k', async () => 3)).toBe(3);
  });

  it('namespaces keys', async () => {
    const store = mem();
    await createCache<number>(store, 'ns', 1000, () => 0).set('k', 1);
    expect([...store.m.keys()]).toEqual(['ns:k']);
  });
});
