// SKU page: price bars, suspicious-discount warning and chart above the buybox.
import PriceBars from '../components/PriceBars.svelte';
import { loadSettings, settingsItem } from '../lib/settings';
import { mountShadow } from '../lib/mount';
import { reactive } from '../lib/reactive.svelte';
import { getHistory, marketMinNow, purgeCache, setRequestRate } from '../lib/skroutz';
import type { PricePoint } from '../lib/types';

export default defineContentScript({
  matches: ['https://www.skroutz.gr/s/*'],
  runAt: 'document_idle',
  async main(ctx) {
    const m = location.pathname.match(/^\/s\/(\d+)\/([^/]+?)(?:\.html)?$/);
    if (!m) return;
    const settings = await loadSettings();
    setRequestRate(settings.requestsPerSecond);
    void purgeCache();
    const anchor = document.querySelector('article.buybox') ?? document.querySelector('.js-header-content');
    if (!anchor) return;
    const host = document.createElement('sv-bars');
    host.style.display = 'block';
    host.style.margin = '0 0 8px';
    anchor.prepend(host);
    const props = reactive({ price: null as number | null, points: null as PricePoint[] | null, settings, showMarket: false });
    const unmount = mountShadow(host, PriceBars, props);
    ctx.onInvalidated(() => {
      unmount();
      host.remove();
    });
    const unwatch = settingsItem.watch(async () => (props.settings = await loadSettings()));
    ctx.onInvalidated(unwatch);
    try {
      const pts = await getHistory(Number(m[1]), m[2] ?? '');
      props.price = marketMinNow(pts);
      props.points = pts;
    } catch {
      props.points = [];
    }
  },
});
