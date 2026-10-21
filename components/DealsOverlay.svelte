<svelte:options css="injected" />

<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import type { ListingItem, PricePoint } from '../lib/types';
  import type { Settings } from '../lib/settings';
  import { PERIOD_LABEL } from '../lib/settings';
  import { filterDeals, scoreRow, type DealRow } from '../lib/deals';
  import { detectFakeDiscount } from '../lib/fakeDiscount';
  import { getHistory, getListingPage, marketMinNow, onRateLimited, statsFor } from '../lib/skroutz';
  import { fmtEuro } from '../lib/mount';
  import PriceBars from './PriceBars.svelte';

  let { pageUrl, settings, storefront }: { pageUrl: string; settings: Settings; storefront: boolean } = $props();

  let open = $state(false);
  let scanning = $state(false);
  let stopRequested = false;
  let rows = $state<DealRow[]>([]);
  const series = new Map<number, PricePoint[]>();
  let progress = $state({ page: 0, pages: 0, done: 0, total: 0, errors: 0 });
  let throttled = $state('');

  // Skroutz answered 429: stop the scan at once so Cloudflare does not ban the IP.
  onDestroy(
    onRateLimited((ms) => {
      if (!scanning) return;
      stopRequested = true;
      throttled = `Το Skroutz ζήτησε να κόψουμε ταχύτητα. Η σάρωση σταμάτησε· δοκίμασε ξανά σε ${Math.ceil(ms / 1000)}″ ή μείωσε τα αιτήματα/δευτ. στις ρυθμίσεις.`;
    }),
  );

  const estimateMin = $derived(Math.ceil((settings.scanMaxPages * 48) / settings.requestsPerSecond / 60));

  // filters
  let maxGap = $state(50); // percent; 50 = no limit
  let minClose = $state(0); // percent
  let hideFake = $state(false);
  let sort = $state<'history' | 'market' | 'price'>(untrack(() => (storefront ? 'market' : 'history')));
  let limit = $state(60);

  const shown = $derived(
    filterDeals(rows, {
      maxMarketGapPct: storefront && maxGap < 50 ? maxGap / 100 : undefined,
      minHistoryCloseness: minClose > 0 ? minClose / 100 : undefined,
      hideFake,
      sort,
    }),
  );

  async function scan() {
    if (scanning) return;
    scanning = true;
    stopRequested = false;
    throttled = '';
    rows = [];
    series.clear();
    progress = { page: 0, pages: 0, done: 0, total: 0, errors: 0 };
    try {
      // 1. Listing pages, one after another.
      const items: ListingItem[] = [];
      const seen = new Set<number>();
      const first = await getListingPage(pageUrl, 1);
      progress.pages = Math.max(1, Math.min(settings.scanMaxPages, first.totalPages || 1));
      for (let p = 1; p <= progress.pages && !stopRequested; p++) {
        const page = p === 1 ? first : await getListingPage(pageUrl, p).catch(() => null);
        progress.page = p;
        if (!page) {
          progress.errors++;
          continue;
        }
        for (const item of page.items) {
          if (seen.has(item.skuId) || (item.sponsored && settings.hideSponsored)) continue;
          seen.add(item.skuId);
          items.push(item);
        }
        progress.total = items.length;
      }
      // 2. Price history, by two workers that check the stop flag before every request.
      let next = 0;
      const worker = async () => {
        while (!stopRequested && next < items.length) {
          const item = items[next++];
          try {
            const pts = await getHistory(item.skuId, item.slug);
            series.set(item.skuId, pts);
            rows.push({
              item,
              stats: statsFor(pts, settings.period),
              marketMin: storefront ? marketMinNow(pts) : null,
              fake: detectFakeDiscount(pts)?.suspicious ?? false,
            });
          } catch {
            progress.errors++;
          } finally {
            progress.done++;
          }
        }
      };
      await Promise.all([worker(), worker()]);
    } catch {
      progress.errors++;
    } finally {
      scanning = false;
    }
  }

  function pctLabel(v: number | null) {
    return v == null ? '–' : `${Math.round(v * 100)}%`;
  }
</script>

<button type="button" class="fab" onclick={() => (open = !open)} title="Σάρωσε όλες τις σελίδες και δες τι αξίζει">
  {open ? '✕' : '💰 Τι αξίζει εδώ'}
</button>

{#if open}
  <aside class="panel">
    <header>
      <strong>Τι αξίζει εδώ</strong>
      <span class="muted">ιστορικό: {PERIOD_LABEL[settings.period]}</span>
    </header>

    <div class="actions">
      {#if scanning}
        <button type="button" onclick={() => (stopRequested = true)}>Διακοπή</button>
        <span class="muted">σελίδα {progress.page}/{progress.pages} · {progress.done}/{progress.total} προϊόντα</span>
      {:else}
        <button type="button" class="primary" onclick={scan}>{rows.length ? 'Νέα σάρωση' : 'Σάρωση'}</button>
        <span class="muted">
          {#if progress.total}{rows.length} προϊόντα από {progress.pages} σελίδες{#if progress.errors} · {progress.errors} σφάλματα{/if}
          {:else}έως {settings.scanMaxPages} σελίδες · ~{estimateMin}′ (τα αποθηκευμένα πιο γρήγορα){/if}
        </span>
      {/if}
    </div>

    {#if throttled}<p class="warn">{throttled}</p>{/if}

    {#if rows.length}
      <div class="filters">
        {#if storefront}
          <label>
            Έως <b>{maxGap >= 50 ? 'οποιοδήποτε' : `+${maxGap}%`}</b> πάνω από τη φθηνότερη τιμή αγοράς
            <input type="range" min="0" max="50" step="1" bind:value={maxGap} />
          </label>
        {/if}
        <label>
          Κοντά στο ιστορικό ελάχιστο: τουλάχιστον <b>{minClose}%</b>
          <input type="range" min="0" max="100" step="5" bind:value={minClose} />
        </label>
        <div class="line">
          <label class="chk"><input type="checkbox" bind:checked={hideFake} /> Κρύψε ύποπτες εκπτώσεις</label>
          <select bind:value={sort}>
            <option value="history">Πιο κοντά στο ιστορικό ελάχιστο</option>
            {#if storefront}<option value="market">Πιο κοντά στη φθηνότερη αγοράς</option>{/if}
            <option value="price">Φθηνότερα πρώτα</option>
          </select>
        </div>
        {#if storefront}
          <div class="line">
            <button type="button" class="link" onclick={() => { maxGap = 0; sort = 'history'; }}>Μόνο φθηνότερα της αγοράς</button>
            <button type="button" class="link" onclick={() => { maxGap = 50; minClose = 0; hideFake = false; }}>Καθάρισμα</button>
          </div>
        {/if}
      </div>

      <div class="count muted">{shown.length} από {rows.length}</div>
      <ol class="list">
        {#each shown.slice(0, limit) as row (row.item.skuId)}
          {@const s = scoreRow(row)}
          <li>
            {#if row.item.imageUrl}<img src={row.item.imageUrl} alt="" loading="lazy" />{/if}
            <div class="body">
              <a href={row.item.url} target="_blank" rel="noopener">{row.item.name}</a>
              <div class="meta">
                <b>{fmtEuro(row.item.price)}</b>
                · ιστορικό {pctLabel(s.historyCloseness)}
                {#if storefront}· αγορά {s.marketGapPct == null ? '–' : s.marketGapPct < 0.005 ? 'φθηνότερο' : `+${Math.round(s.marketGapPct * 100)}%`}{/if}
                {#if row.item.reviewScore}· ★ {row.item.reviewScore} ({row.item.reviewsCount}){/if}
              </div>
              <PriceBars price={row.item.price} points={series.get(row.item.skuId) ?? []} {settings} showMarket={storefront} />
            </div>
          </li>
        {/each}
      </ol>
      {#if shown.length > limit}
        <button type="button" class="more" onclick={() => (limit += 60)}>Περισσότερα</button>
      {/if}
    {/if}
  </aside>
{/if}

<style>
  :host,
  * {
    box-sizing: border-box;
  }
  .fab {
    position: fixed;
    right: 18px;
    bottom: 18px;
    z-index: 2147483000;
    border: 0;
    border-radius: 22px;
    padding: 10px 16px;
    font: 600 14px system-ui, sans-serif;
    background: #f68b24;
    color: #fff;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
  }
  .panel {
    position: fixed;
    right: 18px;
    bottom: 70px;
    z-index: 2147483000;
    width: 440px;
    max-width: calc(100vw - 36px);
    max-height: calc(100vh - 100px);
    overflow: auto;
    padding: 12px 14px;
    background: #fff;
    color: #222;
    font: 13px/1.4 system-ui, sans-serif;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 8px;
    font-size: 15px;
  }
  .muted {
    color: #777;
    font-size: 12px;
  }
  .actions {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 8px;
  }
  button {
    font: inherit;
    cursor: pointer;
    border: 1px solid #ddd;
    background: #fff;
    border-radius: 8px;
    padding: 5px 12px;
  }
  .primary {
    background: #f68b24;
    border-color: #f68b24;
    color: #fff;
    font-weight: 600;
  }
  .link {
    border: 0;
    padding: 0;
    color: #c4610a;
    text-decoration: underline;
  }
  .filters {
    display: grid;
    gap: 6px;
    padding: 8px;
    background: #f6f6f6;
    border-radius: 8px;
    font-size: 12px;
  }
  .filters input[type='range'] {
    width: 100%;
    accent-color: #f68b24;
  }
  .line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  select {
    font: inherit;
    font-size: 12px;
  }
  .warn {
    margin: 0 0 8px;
    padding: 6px 8px;
    border-radius: 8px;
    background: #fff4e5;
    color: #8a4b00;
    font-size: 12px;
  }
  .count {
    margin: 6px 0 2px;
  }
  .list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .list li {
    display: flex;
    gap: 8px;
    padding: 8px 0;
    border-bottom: 1px solid #eee;
  }
  .list img {
    width: 52px;
    height: 52px;
    object-fit: contain;
    flex: none;
  }
  .body {
    flex: 1;
    min-width: 0;
  }
  .body a {
    color: #222;
    font-weight: 600;
    text-decoration: none;
  }
  .body a:hover {
    text-decoration: underline;
  }
  .meta {
    font-size: 12px;
    color: #555;
  }
  .more {
    width: 100%;
    margin-top: 8px;
  }
</style>
