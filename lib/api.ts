export class HttpError extends Error {
  status: number;
  constructor(status: number, url: string) {
    super(`HTTP ${status} for ${url}`);
    this.name = 'HttpError';
    this.status = status;
  }
}

export interface ClientOptions {
  fetch?: (input: string, init?: RequestInit) => Promise<Response>;
  concurrency?: number;
  retries?: number;
  baseDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
  /** Minimum time between two request starts (global rate limit). */
  minIntervalMs?: number;
  /** Pause after a 429 without Retry-After; doubles on consecutive 429s. Defaults to baseDelayMs. */
  cooldownMs?: number;
  /** Called with the pause length (ms) whenever the server rate-limits us. */
  onRateLimited?: (pauseMs: number) => void;
  now?: () => number;
}

export interface Client {
  json(url: string): Promise<any>;
  text(url: string): Promise<string>;
}

export function createClient(opts: ClientOptions = {}): Client {
  const doFetch = opts.fetch ?? ((input: string, init?: RequestInit) => globalThis.fetch(input, init));
  const concurrency = Math.max(1, opts.concurrency ?? 4);
  const retries = opts.retries ?? 2;
  const baseDelayMs = opts.baseDelayMs ?? 500;
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));

  const minIntervalMs = opts.minIntervalMs ?? 0;
  const cooldownMs = opts.cooldownMs ?? baseDelayMs;
  const now = opts.now ?? (() => Date.now());

  let active = 0;
  const waiting: Array<() => void> = [];
  const acquire = async () => {
    if (active < concurrency) {
      active++;
      return;
    }
    await new Promise<void>((resolve) => waiting.push(resolve));
  };
  const release = () => {
    const next = waiting.shift();
    if (next) next(); // the slot passes straight to the next waiter
    else active--;
  };

  // Shared by all requests of this client: a 429 pauses everyone.
  let nextStart = 0;
  let pauseUntil = 0;
  let strikes = 0;

  /** Wait until both the rate limit and any 429 pause allow a new request. */
  async function gate() {
    for (;;) {
      const t = now();
      const at = Math.max(nextStart, pauseUntil);
      if (at <= t) {
        nextStart = t + minIntervalMs;
        return;
      }
      await sleep(at - t);
    }
  }

  function rateLimited(res: Response) {
    const header = res.headers.get('Retry-After');
    const ra = header === null ? NaN : Number(header);
    const pause = Number.isFinite(ra) && ra >= 0 ? ra * 1000 : cooldownMs * 2 ** strikes;
    strikes++;
    pauseUntil = Math.max(pauseUntil, now() + pause);
    opts.onRateLimited?.(pause);
  }

  async function request(url: string, headers?: Record<string, string>): Promise<Response> {
    for (let attempt = 0; ; attempt++) {
      let failure: unknown;
      let backoff = 0;
      await acquire();
      try {
        await gate();
        const res = await doFetch(url, { credentials: 'include', headers });
        if (res.ok) {
          strikes = 0;
          return res;
        }
        failure = new HttpError(res.status, url);
        if (res.status === 429) rateLimited(res);
        else if (res.status >= 500) backoff = baseDelayMs * 2 ** attempt;
        else throw failure;
      } catch (e) {
        if (e instanceof HttpError && e.status !== 429 && e.status < 500) throw e;
        if (!(e instanceof HttpError)) backoff = baseDelayMs * 2 ** attempt;
        failure = e;
      } finally {
        release();
      }
      if (attempt >= retries) throw failure;
      if (backoff) await sleep(backoff);
    }
  }

  return {
    json: async (url) => (await request(url, { Accept: 'application/json' })).json(),
    text: async (url) => (await request(url)).text(),
  };
}

export interface KeyValueStore {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
}

export interface Cache<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T): Promise<void>;
  getOrLoad(key: string, loader: () => Promise<T>): Promise<T>;
}

export function createCache<T>(
  store: KeyValueStore,
  namespace: string,
  ttlMs: number,
  now: () => number = Date.now,
): Cache<T> {
  const full = (k: string) => `${namespace}:${k}`;
  const inflight = new Map<string, Promise<T>>();
  const cache: Cache<T> = {
    async get(k) {
      const entry = (await store.get(full(k))) as { v: T; t: number } | null;
      if (!entry || typeof entry.t !== 'number' || now() - entry.t > ttlMs) return null;
      return entry.v;
    },
    async set(k, v) {
      await store.set(full(k), { v, t: now() });
    },
    getOrLoad(k, loader) {
      // Concurrent callers for the same key share one load.
      const running = inflight.get(k);
      if (running) return running;
      const p = (async () => {
        const hit = await cache.get(k);
        if (hit !== null) return hit;
        const v = await loader();
        await cache.set(k, v);
        return v;
      })().finally(() => inflight.delete(k));
      inflight.set(k, p);
      return p;
    },
  };
  return cache;
}
