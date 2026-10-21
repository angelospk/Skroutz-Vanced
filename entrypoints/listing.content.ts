// Category, search, brand and shop storefront pages: hide sponsored cards,
// add price bars to each card, and the "Τι αξίζει εδώ" scanner.
import DealsOverlay from '../components/DealsOverlay.svelte';
import PriceBars from '../components/PriceBars.svelte';
import { loadSettings, settingsItem, type Settings } from '../lib/settings';
import { mountShadow } from '../lib/mount';
import { reactive } from '../lib/reactive.svelte';
import { parsePrice } from '../lib/price';
import { getHistory, purgeCache, setRequestRate } from '../lib/skroutz';
import type { PricePoint } from '../lib/types';

const CARD = 'li[data-skuid]';
const HOST_TAG = 'sv-bars';

export default defineContentScript({
  matches: [
    'https://www.skroutz.gr/c/*',
    'https://www.skroutz.gr/search*',
    'https://www.skroutz.gr/shop/*',
    'https://www.skroutz.gr/m.*',
  ],
  runAt: 'document_idle',
  async main(ctx) {
    let settings = await loadSettings();
    setRequestRate(settings.requestsPerSecond);
    void purgeCache();
    const storefront = location.pathname.startsWith('/shop/');
    // Per decorated card: its unmount function and reactive props.
    const cards = new Map<Element, { unmount: () => void; host: HTMLElement; props: { settings: Settings } }>();

    const isSponsored = (li: Element) => !!li.querySelector('a[href*="sponsored="], a[href*="from=featured"]');

    function applySponsored(li: HTMLElement) {
      li.style.display = settings.hideSponsored && isSponsored(li) ? 'none' : '';
    }

    function decorate(li: HTMLElement) {
      applySponsored(li);
      if (cards.has(li) || li.style.display === 'none') return;
      const skuId = Number(li.dataset.skuid);
      const link = li.querySelector<HTMLAnchorElement>('a.js-sku-link[href*="/s/"]');
      const slug = link?.pathname.match(/^\/s\/\d+\/(.+)\.html$/)?.[1] ?? '';
      const price = parsePrice(li.querySelector('.price')?.textContent ?? '');
      const anchor = li.querySelector('.card-content .price') ?? li.querySelector('.card-content');
      if (!skuId || !anchor) return;
      const host = document.createElement(HOST_TAG);
      host.style.display = 'block';
      anchor.after(host);
      const props = reactive({ price, points: null as PricePoint[] | null, settings, showMarket: storefront });
      cards.set(li, { unmount: mountShadow(host, PriceBars, props), host, props });
      getHistory(skuId, slug)
        .then((pts) => (props.points = pts))
        .catch(() => (props.points = []));
    }

    // Fetch history only for cards that come near the viewport.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.unobserve(e.target);
          decorate(e.target as HTMLElement);
        }
      },
      { rootMargin: '600px 0px' },
    );
    const seen = new WeakSet<Element>();
    function scan() {
      document.querySelectorAll<HTMLElement>(CARD).forEach((li) => {
        applySponsored(li);
        if (seen.has(li)) return;
        seen.add(li);
        io.observe(li);
      });
    }
    /** Release cards that Skroutz removed from the page (filters, infinite scroll). */
    function sweep() {
      for (const [li, card] of cards) {
        if (li.isConnected) continue;
        // The node may come back later (e.g. re-sorting): forget it fully so it is decorated again.
        card.unmount();
        card.host.remove();
        cards.delete(li);
        seen.delete(li);
      }
    }
    scan();
    const mo = new MutationObserver(() => {
      scan();
      sweep();
    });
    mo.observe(document.body, { childList: true, subtree: true });
    ctx.onInvalidated(() => {
      mo.disconnect();
      io.disconnect();
      cards.forEach((c) => c.unmount());
      cards.clear();
    });

    const fab = document.createElement('sv-deals');
    document.body.append(fab);
    const overlayProps = reactive({ pageUrl: location.href, settings, storefront });
    const unmountOverlay = mountShadow(fab, DealsOverlay, overlayProps);
    ctx.onInvalidated(() => {
      unmountOverlay();
      fab.remove();
    });

    ctx.setInterval(() => void purgeCache(), 3600_000);

    const unwatch = settingsItem.watch(async () => {
      settings = await loadSettings();
      setRequestRate(settings.requestsPerSecond);
      overlayProps.settings = settings;
      cards.forEach((c) => (c.props.settings = settings));
      document.querySelectorAll<HTMLElement>(CARD).forEach(applySponsored);
    });
    ctx.onInvalidated(unwatch);
  },
});
