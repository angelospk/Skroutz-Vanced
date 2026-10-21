<svelte:options css="injected" />

<script lang="ts">
  import type { CartLine, CartPlan, ListingItem, Offer } from '../lib/types';
  import type { Settings } from '../lib/settings';
  import { cartTotal, planCheapestCart } from '../lib/optimizer';
  import { keyphraseFor, rankAlternatives } from '../lib/alternatives';
  import { getCartItems, getOffers, searchListing, type CartItemRef } from '../lib/skroutz';
  import { fmtEuro } from '../lib/mount';

  let { settings, nameOf }: { settings: Settings; nameOf: (skuId: number) => string } = $props();

  type Row = { ref: CartItemRef; name: string; offers: Offer[]; current: Offer | null };
  type Alt = { item: ListingItem; similarity: number; saving: number };

  let open = $state(false);
  let busy = $state(false);
  let error = $state('');
  let rows = $state<Row[]>([]);
  let plan = $state<CartPlan | null>(null);
  let now = $state<{ total: number; itemsTotal: number; shippingTotal: number } | null>(null);
  let alts = $state<Record<number, Alt[] | 'loading' | 'none' | 'error'>>({});

  async function compute() {
    busy = true;
    error = '';
    plan = null;
    now = null;
    try {
      const refs = await getCartItems();
      rows = await Promise.all(
        refs.map(async (ref) => {
          const offers = await getOffers(ref.skuId).catch(() => [] as Offer[]);
          return { ref, name: nameOf(ref.skuId), offers, current: offers.find((o) => o.productId === ref.productId) ?? null };
        }),
      );
      const lines: CartLine[] = rows.map((r) => ({
        skuId: r.ref.skuId,
        quantity: r.ref.quantity,
        shopId: r.current?.shopId ?? null,
        offers: r.offers,
      }));
      if (rows.length && rows.every((r) => r.current)) {
        now = cartTotal(lines, Object.fromEntries(rows.map((r) => [r.ref.skuId, r.current!])));
      }
      plan = planCheapestCart(lines, { marketplaceOnly: !settings.includeOffsite });
      if (!plan && rows.length) error = 'Κάποιο προϊόν δεν έχει διαθέσιμη προσφορά για το καλάθι.';
    } catch (e) {
      error = 'Δεν φόρτωσε το καλάθι: ' + String(e);
    } finally {
      busy = false;
    }
  }

  async function findAlt(r: Row) {
    const id = r.ref.skuId;
    alts[id] = 'loading';
    try {
      const res = await searchListing(keyphraseFor(r.name));
      if (!res) {
        alts[id] = 'none';
        return;
      }
      const price = r.current?.price ?? r.offers[0]?.price ?? null;
      const self = res.page.items.find((i) => i.skuId === id);
      const categoryId = self?.categoryId ?? Number(res.url.match(/\/c\/(\d+)\//)?.[1] ?? 0);
      const target: ListingItem = {
        skuId: id,
        name: r.name,
        slug: '',
        url: '',
        price,
        reviewScore: null,
        reviewsCount: 0,
        categoryId,
        sponsored: false,
        imageUrl: null,
      };
      const found = price == null ? [] : rankAlternatives(target, res.page.items, {
        minReviewScore: settings.altMinReviewScore,
        minReviews: settings.altMinReviews,
        includeSponsored: !settings.hideSponsored,
      });
      alts[id] = found.length ? found.slice(0, 5) : 'none';
    } catch {
      alts[id] = 'error';
    }
  }

  const shopName = (o: Offer) => o.shopName || `κατάστημα ${o.shopId}`;
</script>

<button type="button" class="fab" onclick={() => { open = !open; if (open && !rows.length) compute(); }}>
  {open ? '✕' : '🧮 Φθηνότερο καλάθι'}
</button>

{#if open}
  <aside class="panel">
    <header>
      <strong>Φθηνότερο καλάθι</strong>
      <button type="button" onclick={compute} disabled={busy}>{busy ? 'Υπολογισμός…' : 'Ξανά'}</button>
    </header>
    {#if error}<p class="err">{error}</p>{/if}

    {#if !busy && !error && rows.length === 0 && plan}
      <p class="muted">Το καλάθι είναι άδειο.</p>
    {:else if plan}
      <div class="summary">
        <div>Τώρα: <b>{now ? fmtEuro(now.total) : '–'}</b></div>
        <div>Φθηνότερος συνδυασμός: <b>{fmtEuro(plan.total)}</b>
          <span class="muted">({fmtEuro(plan.itemsTotal)} + {fmtEuro(plan.shippingTotal)} μεταφορικά, {plan.shopIds.length} {plan.shopIds.length === 1 ? 'κατάστημα' : 'καταστήματα'})</span>
        </div>
        {#if now}
          {#if now.total - plan.total > 0.009}
            <div class="save">Κερδίζεις {fmtEuro(now.total - plan.total)}</div>
          {:else}
            <div class="ok">Το καλάθι σου είναι ήδη το φθηνότερο.</div>
          {/if}
        {/if}
        <p class="muted small">Εκτίμηση: μεταφορικά ανά κατάστημα από τις κάρτες προϊόντος. Το Skroutz μπορεί να χρεώσει διαφορετικά (π.χ. Skroutz Point).</p>
      </div>
    {/if}

    <ol class="list">
      {#each rows as r (r.ref.lineId)}
        {@const best = plan?.choice[r.ref.skuId]}
        <li>
          <div class="name">{r.name}{#if r.ref.quantity > 1} × {r.ref.quantity}{/if}</div>
          <div class="meta">
            Τώρα: {r.current ? `${shopName(r.current)} ${fmtEuro(r.current.price)}` : '–'}
            {#if best && r.current && best.productId !== r.current.productId}
              <br /><span class="save">→ {shopName(best)} {fmtEuro(best.price)}{best.shipping ? ` + ${fmtEuro(best.shipping)} μεταφ.` : ''}</span>
              <a href="/s/{r.ref.skuId}/x.html#shops-list-section" target="_blank" rel="noopener">άλλαξε</a>
            {/if}
          </div>
          {#if alts[r.ref.skuId] === undefined}
            <button type="button" class="link" onclick={() => findAlt(r)}>Βρες φθηνότερη εναλλακτική</button>
          {:else if alts[r.ref.skuId] === 'loading'}
            <span class="muted">Ψάχνω…</span>
          {:else if alts[r.ref.skuId] === 'none'}
            <span class="muted">Καμία φθηνότερη εναλλακτική με καλές κριτικές.</span>
          {:else if alts[r.ref.skuId] === 'error'}
            <span class="err">Η αναζήτηση απέτυχε.</span>
          {:else}
            <ul class="alts">
              {#each (alts[r.ref.skuId] as Alt[]) as a (a.item.skuId)}
                <li>
                  <a href={a.item.url} target="_blank" rel="noopener">{a.item.name}</a>
                  <span class="muted">{fmtEuro(a.item.price)} · ★ {a.item.reviewScore ?? '–'} ({a.item.reviewsCount}) · ομοιότητα {Math.round(a.similarity * 100)}%</span>
                  <span class="save">−{fmtEuro(a.saving)}</span>
                </li>
              {/each}
            </ul>
          {/if}
        </li>
      {/each}
    </ol>
  </aside>
{/if}

<style>
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
    align-items: center;
    font-size: 15px;
    margin-bottom: 8px;
  }
  button {
    font: inherit;
    cursor: pointer;
    border: 1px solid #ddd;
    background: #fff;
    border-radius: 8px;
    padding: 4px 10px;
  }
  .link {
    border: 0;
    padding: 0;
    color: #c4610a;
    text-decoration: underline;
    font-size: 12px;
  }
  .summary {
    padding: 8px;
    background: #f6f6f6;
    border-radius: 8px;
  }
  .save {
    color: #1e8e3e;
    font-weight: 600;
  }
  .ok {
    color: #1e8e3e;
  }
  .err {
    color: #d93025;
  }
  .muted {
    color: #777;
    font-size: 12px;
  }
  .small {
    font-size: 11px;
    margin: 4px 0 0;
  }
  .list {
    list-style: none;
    padding: 0;
    margin: 8px 0 0;
  }
  .list > li {
    padding: 8px 0;
    border-bottom: 1px solid #eee;
  }
  .name {
    font-weight: 600;
  }
  .meta {
    font-size: 12px;
    color: #555;
  }
  .meta a {
    color: #c4610a;
    margin-left: 6px;
  }
  .alts {
    margin: 4px 0 0;
    padding-left: 16px;
    font-size: 12px;
  }
  .alts li {
    margin: 3px 0;
  }
  .alts a {
    color: #222;
  }
  .alts span {
    margin-left: 4px;
  }
</style>
