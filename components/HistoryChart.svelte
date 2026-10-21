<svelte:options css="injected" />

<script lang="ts">
  import type { PricePoint } from '../lib/types';
  import { fmtEuro } from '../lib/mount';

  let { points, width = 300, height = 110 }: { points: PricePoint[]; width?: number; height?: number } = $props();

  const pad = { l: 4, r: 4, t: 8, b: 14 };
  let hover = $state<number | null>(null);

  const geo = $derived.by(() => {
    if (points.length < 2) return null;
    const t0 = points[0].ts;
    const t1 = points[points.length - 1].ts;
    const vals = points.map((p) => p.value);
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const span = hi - lo || 1;
    const x = (ts: number) => pad.l + ((ts - t0) / (t1 - t0 || 1)) * (width - pad.l - pad.r);
    const y = (v: number) => pad.t + (1 - (v - lo) / span) * (height - pad.t - pad.b);
    const sorted = [...vals].sort((a, b) => a - b);
    const mid = sorted.length >> 1;
    const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    return {
      x,
      y,
      lo,
      hi,
      median,
      line: points.map((p) => `${x(p.ts).toFixed(1)},${y(p.value).toFixed(1)}`).join(' '),
    };
  });

  function onMove(e: MouseEvent) {
    if (!geo) return;
    const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    let best = 0;
    for (let i = 1; i < points.length; i++) {
      if (Math.abs(geo.x(points[i].ts) - px) < Math.abs(geo.x(points[best].ts) - px)) best = i;
    }
    hover = best;
  }

  const day = (ts: number) => new Date(ts * 1000).toLocaleDateString('el-GR', { day: 'numeric', month: 'short', year: '2-digit' });
</script>

{#if geo}
  <svg
    viewBox="0 0 {width} {height}"
    {width}
    {height}
    role="img"
    aria-label="Εξέλιξη χαμηλότερης τιμής"
    onmousemove={onMove}
    onmouseleave={() => (hover = null)}
  >
    <line class="ref min" x1={pad.l} x2={width - pad.r} y1={geo.y(geo.lo)} y2={geo.y(geo.lo)} />
    <line class="ref med" x1={pad.l} x2={width - pad.r} y1={geo.y(geo.median)} y2={geo.y(geo.median)} />
    <polyline points={geo.line} />
    <text x={pad.l} y={height - 2}>{day(points[0].ts)}</text>
    <text x={width - pad.r} y={height - 2} text-anchor="end">{day(points[points.length - 1].ts)}</text>
    {#if hover !== null}
      {@const p = points[hover]}
      <circle cx={geo.x(p.ts)} cy={geo.y(p.value)} r="3" />
      <text class="tip" x={Math.min(geo.x(p.ts), width - 110)} y="9">{day(p.ts)} · {fmtEuro(p.value)}</text>
    {/if}
  </svg>
  <div class="legend"><span class="k min"></span>ελάχιστη {fmtEuro(geo.lo)} <span class="k med"></span>τυπική {fmtEuro(geo.median)}</div>
{:else}
  <div class="legend">Δεν υπάρχουν αρκετά δεδομένα.</div>
{/if}

<style>
  svg {
    display: block;
    max-width: 100%;
    height: auto;
    cursor: crosshair;
  }
  polyline {
    fill: none;
    stroke: #f68b24;
    stroke-width: 1.6;
  }
  .ref {
    stroke-width: 1;
    stroke-dasharray: 3 3;
  }
  .ref.min,
  .k.min {
    stroke: #1e8e3e;
    background: #1e8e3e;
  }
  .ref.med,
  .k.med {
    stroke: #888;
    background: #888;
  }
  text {
    font-size: 9px;
    fill: #666;
  }
  .tip {
    fill: #222;
    font-weight: 600;
  }
  circle {
    fill: #f68b24;
  }
  .legend {
    font-size: 11px;
    color: #555;
  }
  .k {
    display: inline-block;
    width: 10px;
    height: 2px;
    margin: 0 3px 3px 6px;
    vertical-align: middle;
  }
</style>
