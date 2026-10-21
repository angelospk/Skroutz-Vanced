<svelte:options css="injected" />

<script lang="ts">
  import type { PricePoint } from '../lib/types';
  import type { Settings } from '../lib/settings';
  import { PERIOD_DAYS, PERIOD_LABEL } from '../lib/settings';
  import { closeness } from '../lib/history';
  import { detectFakeDiscount } from '../lib/fakeDiscount';
  import { marketMinNow, statsFor } from '../lib/skroutz';
  import { fmtEuro, heatColor } from '../lib/mount';
  import HistoryChart from './HistoryChart.svelte';

  let {
    price,
    points,
    settings,
    showMarket = false,
  }: {
    /** Price on this card / page. */
    price: number | null;
    /** Merged daily market-low series. */
    points: PricePoint[] | null;
    settings: Settings;
    /** Show the "vs market low" bar (true on shop storefronts). */
    showMarket?: boolean;
  } = $props();

  let chartOpen = $state(false);

  const stats = $derived(points ? statsFor(points, settings.period) : null);
  const marketMin = $derived(points ? marketMinNow(points) : null);
  const fake = $derived(points ? detectFakeDiscount(points) : null);
  const periodPoints = $derived.by(() => {
    if (!points?.length) return [];
    const cutoff = points[points.length - 1].ts - PERIOD_DAYS[settings.period] * 86400;
    return points.filter((p) => p.ts >= cutoff);
  });

  const pos = (v: number, lo: number, hi: number) => (hi > lo ? Math.max(0, Math.min(1, (v - lo) / (hi - lo))) : 0) * 100;

  const market = $derived.by(() => {
    if (!showMarket || !settings.showMarketBar || price == null || marketMin == null) return null;
    const hi = marketMin * (1 + settings.marketRedPct / 100);
    const gap = Math.max(0, (price - marketMin) / marketMin);
    return { pct: pos(price, marketMin, hi), gap, color: heatColor(closeness(price, marketMin, hi)) };
  });

  const hist = $derived.by(() => {
    if (!settings.showHistoryBar || price == null || !stats) return null;
    return {
      pct: pos(price, stats.min, stats.max),
      med: pos(stats.median, stats.min, stats.max),
      mean: pos(stats.mean, stats.min, stats.max),
      color: heatColor(closeness(price, stats.min, stats.median)),
    };
  });
</script>

{#if points === null}
  <div class="sv loading">Ιστορικό τιμής…</div>
{:else if market || hist || fake?.suspicious}
  <div class="sv">
    {#if market}
      <div class="row" title="Η τιμή εδώ σε σχέση με τη φθηνότερη τιμή της αγοράς σήμερα">
        <span class="lbl">Αγορά</span>
        <span class="track"><span class="mark" style:left="{market.pct}%"></span></span>
        <span class="val" style:color={market.color}>
          {market.gap < 0.005 ? 'φθηνότερο' : `+${Math.round(market.gap * 100)}%`}
        </span>
      </div>
    {/if}
    {#if hist && stats}
      <div class="row" title="Η τιμή σε σχέση με το ιστορικό ({PERIOD_LABEL[settings.period]}): ελάχιστη → μέγιστη. | = τυπική, ¦ = μέση">
        <span class="lbl">Ιστορικό</span>
        <span class="track">
          <span class="tick" style:left="{hist.med}%"></span>
          <span class="tick mean" style:left="{hist.mean}%"></span>
          <span class="mark" style:left="{hist.pct}%"></span>
        </span>
        <span class="val" style:color={hist.color}>
          {price != null && price <= stats.min ? 'ελάχιστη' : `+${Math.round(((price! - stats.min) / stats.min) * 100)}%`}
        </span>
      </div>
      <div class="nums">
        ελάχ. {fmtEuro(stats.min)} · τυπ. {fmtEuro(stats.median)} · μέση {fmtEuro(stats.mean)}
        {#if showMarket && marketMin != null}· αγορά {fmtEuro(marketMin)}{/if}
        {#if settings.chart === 'click'}
          <button type="button" class="chartbtn" onclick={(e) => { e.preventDefault(); e.stopPropagation(); chartOpen = !chartOpen; }}>
            {chartOpen ? 'κλείσε' : 'διάγραμμα'}
          </button>
        {/if}
      </div>
    {/if}
    {#if fake?.suspicious}
      <div class="fake" title="Η τιμή ανέβηκε πριν την «έκπτωση». Τυπική τιμή πριν: {fmtEuro(fake.baseline)}, κορυφή: {fmtEuro(fake.peak)}">
        ⚠ Ύποπτη έκπτωση: ανέβηκε στα {fmtEuro(fake.peak)} πριν πέσει
      </div>
    {/if}
    {#if chartOpen}
      <div class="chart"><HistoryChart points={periodPoints} /></div>
    {/if}
  </div>
{/if}

<style>
  .sv {
    font: 11px/1.35 system-ui, sans-serif;
    color: #333;
    margin: 4px 0;
    padding: 4px 6px;
    background: #fafafa;
    border: 1px solid #eee;
    border-radius: 6px;
  }
  .loading {
    color: #999;
  }
  .row {
    display: grid;
    grid-template-columns: 52px 1fr 62px;
    align-items: center;
    gap: 6px;
    margin: 2px 0;
  }
  .lbl {
    color: #666;
  }
  .val {
    font-weight: 700;
    text-align: right;
    white-space: nowrap;
  }
  .track {
    position: relative;
    height: 7px;
    border-radius: 4px;
    background: linear-gradient(90deg, #1e8e3e, #f9ab00 55%, #d93025);
  }
  .mark {
    position: absolute;
    top: -3px;
    width: 3px;
    height: 13px;
    margin-left: -1.5px;
    background: #111;
    border-radius: 2px;
    box-shadow: 0 0 0 1px #fff;
  }
  .tick {
    position: absolute;
    top: 0;
    width: 1px;
    height: 7px;
    background: rgba(255, 255, 255, 0.95);
  }
  .tick.mean {
    background: rgba(0, 0, 0, 0.35);
  }
  .nums {
    color: #666;
    font-size: 10.5px;
  }
  .chartbtn {
    all: unset;
    cursor: pointer;
    color: #f68b24;
    font-weight: 600;
    margin-left: 4px;
  }
  .chartbtn:hover {
    text-decoration: underline;
  }
  .fake {
    margin-top: 3px;
    color: #b06000;
    font-weight: 600;
  }
  .chart {
    margin-top: 4px;
  }
</style>
