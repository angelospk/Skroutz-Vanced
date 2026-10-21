// Live smoke test against the real skroutz.gr with the built extension.
// Needs a display (use `xvfb-run -a` on a headless box): Cloudflare blocks
// headless browsers. Run `npm run build` first.
//
//   xvfb-run -a node scripts/live-check.mjs [outDir]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const ext = resolve('.output/chrome-mv3');
const out = resolve(process.argv[2] ?? '.live-check');
mkdirSync(out, { recursive: true });

const ctx = await chromium.launchPersistentContext(resolve(out, 'profile'), {
  headless: false,
  viewport: { width: 1400, height: 1000 },
  args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`, '--disable-blink-features=AutomationControlled'],
});
const page = ctx.pages()[0] ?? (await ctx.newPage());
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

async function open(url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 20 && /Just a moment/i.test(await page.title()); i++) await page.waitForTimeout(1500);
  await page.waitForTimeout(3000);
}

/** Text inside every shadow root hosted by `tag`. */
const shadowText = (tag) =>
  page.evaluate(
    (t) =>
      [...document.querySelectorAll(t)].map((h) => {
        const root = h.shadowRoot;
        if (!root) return '';
        const copy = document.createElement('div');
        copy.append(...[...root.childNodes].map((n) => n.cloneNode(true)));
        copy.querySelectorAll('style').forEach((s) => s.remove());
        return copy.textContent.replace(/\s+/g, ' ').trim();
      }),
    tag,
  );

const results = {};
let ok = true;
function check(name, cond, detail) {
  results[name] = { pass: !!cond, detail };
  if (!cond) ok = false;
  console.log(cond ? 'PASS' : 'FAIL', name, detail ?? '');
}

// 1. Category page: bars on cards, sponsored hidden.
await open('https://www.skroutz.gr/c/40/kinhta-thlefwna.html');
await page.mouse.wheel(0, 1500);
await page.waitForTimeout(6000);
let bars = await shadowText('sv-bars');
check('category: bars mounted', bars.length >= 5, `${bars.length} hosts`);
check('category: bars show history', bars.filter((t) => /ελάχ\./.test(t)).length >= 3, bars.slice(0, 2).join(' | '));
const visibleSponsored = await page.evaluate(
  () => [...document.querySelectorAll('li[data-skuid]')].filter((li) => li.querySelector('a[href*="sponsored="]') && li.offsetParent !== null).length,
);
check('category: sponsored hidden', visibleSponsored === 0, `${visibleSponsored} visible`);
await page.screenshot({ path: resolve(out, 'category.png') });

// 2. Chart opens on click.
await page.evaluate(() => {
  const b = [...document.querySelectorAll('sv-bars')].map((h) => h.shadowRoot?.querySelector('.chartbtn')).find(Boolean);
  b?.click();
});
await page.waitForTimeout(800);
const hasChart = await page.evaluate(() => [...document.querySelectorAll('sv-bars')].some((h) => h.shadowRoot?.querySelector('svg polyline')));
check('category: chart opens', hasChart);

// 3. Shop storefront: market bar + deals scan.
await open('https://www.skroutz.gr/shop/24271/T-support/products.html');
await page.waitForTimeout(5000);
bars = await shadowText('sv-bars');
check('shop: market bar', bars.some((t) => /Αγορά/.test(t)), bars[0]);
await page.evaluate(() => document.querySelector('sv-deals')?.shadowRoot?.querySelector('.fab')?.click());
await page.waitForTimeout(500);
await page.evaluate(() => document.querySelector('sv-deals')?.shadowRoot?.querySelector('.primary')?.click());
for (let i = 0; i < 200; i++) {
  await page.waitForTimeout(2000);
  const busy = await page.evaluate(() => !!document.querySelector('sv-deals')?.shadowRoot?.querySelector('.actions')?.textContent?.includes('Διακοπή'));
  if (!busy) break;
}
const deals = await page.evaluate(() => {
  const r = document.querySelector('sv-deals')?.shadowRoot;
  return { rows: r?.querySelectorAll('.list > li').length ?? 0, status: r?.querySelector('.actions')?.textContent?.replace(/\s+/g, ' ') };
});
check('shop: deals scan lists products', deals.rows >= 20, JSON.stringify(deals));
await page.screenshot({ path: resolve(out, 'shop-deals.png') });

// 4. Product page bars.
await open('https://www.skroutz.gr/s/59304245/Samsung-Galaxy-A56-5G-Dual-SIM-8-128GB-Awesome-Graphite.html');
await page.waitForTimeout(3000);
bars = await shadowText('sv-bars');
check('product: bars', bars.some((t) => /ελάχ\./.test(t)), bars[0]);
await page.screenshot({ path: resolve(out, 'product.png') });

// 5. Cart: add two items, plan + alternatives.
for (const u of ['https://www.skroutz.gr/s/59304245/x.html', 'https://www.skroutz.gr/s/70154067/x.html']) {
  await open(u);
  const b = page.getByRole('button', { name: /Προσθήκη στο καλάθι/i }).first();
  if (await b.count()) await b.click({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(3000);
}
await open('https://www.skroutz.gr/cart');
await page.evaluate(() => document.querySelector('sv-cart')?.shadowRoot?.querySelector('.fab')?.click());
await page.waitForTimeout(12000);
const cart = await page.evaluate(() => document.querySelector('sv-cart')?.shadowRoot?.querySelector('.panel')?.textContent?.replace(/\s+/g, ' '));
check('cart: plan computed', /Φθηνότερος συνδυασμός/.test(cart ?? ''), cart?.slice(0, 300));
await page.evaluate(() => document.querySelector('sv-cart')?.shadowRoot?.querySelector('.link')?.click());
await page.waitForTimeout(10000);
const alt = await page.evaluate(() => document.querySelector('sv-cart')?.shadowRoot?.querySelector('.list > li')?.textContent?.replace(/\s+/g, ' '));
check('cart: alternatives answered', !/Ψάχνω/.test(alt ?? '') && /εναλλακτικ|ομοιότητα|απέτυχε/.test(alt ?? ''), alt?.slice(0, 300));
await page.screenshot({ path: resolve(out, 'cart.png'), fullPage: false });

check('no page errors from extension', !errors.some((e) => /sv-|svelte|chrome-extension/i.test(e)), errors.slice(0, 5).join(' || '));

await ctx.close();
process.exit(ok ? 0 : 1);
