// Cart page: cheapest shop combination and cheaper alternatives.
import CartPanel from '../components/CartPanel.svelte';
import { loadSettings, settingsItem } from '../lib/settings';
import { mountShadow } from '../lib/mount';
import { reactive } from '../lib/reactive.svelte';
import { purgeCache, setRequestRate } from '../lib/skroutz';

/** Product title as shown in the cart DOM. */
function nameOf(skuId: number): string {
  const links = document.querySelectorAll<HTMLAnchorElement>(`a[href*="/s/${skuId}/"]`);
  for (const a of links) {
    const t = (a.textContent ?? '').trim() || a.title || a.querySelector('img')?.alt || '';
    if (t) return t.replace(/\s+/g, ' ');
  }
  return `Προϊόν ${skuId}`;
}

export default defineContentScript({
  matches: ['https://www.skroutz.gr/cart*'],
  runAt: 'document_idle',
  async main(ctx) {
    const settings = await loadSettings();
    setRequestRate(settings.requestsPerSecond);
    void purgeCache();
    const host = document.createElement('sv-cart');
    document.body.append(host);
    const props = reactive({ settings, nameOf });
    const unmount = mountShadow(host, CartPanel, props);
    settingsItem.watch(async () => (props.settings = await loadSettings()));
    ctx.onInvalidated(() => {
      unmount();
      host.remove();
    });
  },
});
