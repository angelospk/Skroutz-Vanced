# Skroutz Vanced

Chrome extension for [skroutz.gr](https://www.skroutz.gr). It shows how good a price really is, scans a whole shop or category for the products worth buying, and finds the cheapest way to buy your cart.

Built with [WXT](https://wxt.dev) (Manifest V3), Svelte 5 and TypeScript.

## Features

| Where | What |
|-------|------|
| Category, search, brand and shop pages | Two colour bars on every product card. **Αγορά** (shop pages only): this shop's price compared with the cheapest price on Skroutz today. **Ιστορικό**: today's price inside the lowest/highest range of the chosen period, with ticks for the typical (median) and mean price. Click **διάγραμμα** for the price chart. |
| Same pages | **Τι αξίζει εδώ** button: reads all listing pages (up to a limit), loads the price history of each product and lists them ranked. Filters: max % over the market low, min closeness to the historic low, hide suspicious discounts, sort. |
| Product page | The same bars above the buy box, plus the chart. |
| Everywhere | **Ύποπτη έκπτωση** warning: the price went up in the last weeks and then "dropped" back to about its usual level. |
| Cart | **Φθηνότερο καλάθι**: the cheapest shop for each item, with shipping counted once per shop (so it also finds when buying more items from one shop is cheaper). **Βρες φθηνότερη εναλλακτική**: cheaper products in the same category with a similar title and good reviews. |
| Popup | Settings: history period, which bars to show, colour threshold, chart on/off, hide sponsored, scan page limit, request concurrency, review thresholds for alternatives, include shops outside the Skroutz cart. |

## Install from source

```bash
npm install
npm run build          # output: .output/chrome-mv3
```

Open `chrome://extensions`, enable Developer mode, click **Load unpacked** and select `.output/chrome-mv3`.

For development with hot reload: `npm run dev`.

## Layout

```
entrypoints/
  listing.content.ts   category / search / brand / shop pages
  product.content.ts   SKU page
  cart.content.ts      cart page
  popup/               settings popup
components/            Svelte UI (mounted in shadow roots, styles isolated from Skroutz)
lib/                   pure logic + Skroutz data access
  api.ts               fetch client: concurrency limit, retry/backoff, TTL cache
  skroutz.ts           endpoints used by the UI (uses browser.storage.local cache)
  history.ts           price-graph parsing and statistics
  fakeDiscount.ts      suspicious discount detection
  listing.ts           listing JSON parsing and URLs
  offers.ts            per-shop offers from the shops_list drawer
  optimizer.ts         cheapest cart (exact branch and bound)
  alternatives.ts      similar cheaper products
  deals.ts             deal scoring, filters and sorting
tests/                 Vitest unit tests with recorded Skroutz fixtures
scripts/live-check.mjs end-to-end smoke test on the real site
```

## Skroutz endpoints used

All requests run in the page (same origin), so they carry the page's cookies.

| Endpoint | Use |
|----------|-----|
| `/s/{id}/{slug}/price_graph?currency=EUR&shipping_country=GR` | daily lowest price history (any slug works) |
| `/s/{id}/shops_list` | per-shop offers (HTML) |
| `{listing}.json?page=N` | category / shop storefront products |
| `/search.json?keyphrase=…` | answers 410 with a `redirectUrl` to the best category |
| `/cart.json` | cart lines |

History is cached for 12 hours and offers for 1 hour.

## Tests

```bash
npm test               # unit tests
npm run check          # svelte-check / types
npm run live-check     # build + real-site smoke test (needs xvfb-run on a headless machine)
```

## Disclaimer

Not affiliated with Skroutz S.A.

## License

MIT
