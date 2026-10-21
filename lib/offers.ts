import type { Offer } from './types';
import { parsePrice } from './price';

const SPONSORED_ATTR = 'data-sku-page--shops-list--card-sponsored-value';

function parseCard(li: Element): Offer | null {
  const shopId = Number(li.getAttribute('data-shop-id'));
  const productId = Number(li.getAttribute('data-card-id'));
  const rawPrice = li.getAttribute('data-raw-price');
  const price = rawPrice === null || rawPrice.trim() === '' ? NaN : Number(rawPrice);
  if (!Number.isFinite(shopId) || !Number.isFinite(productId) || !Number.isFinite(price)) return null;
  const feeText = li.querySelector('.product-card-fee-value')?.textContent;
  const reviewsText = li.querySelector('.merchant-box .reviews')?.textContent ?? '';
  const reviewsMatch = reviewsText.match(/[0-9]+/);
  return {
    shopId,
    shopName: li.querySelector('.merchant-logo img')?.getAttribute('alt') ?? '',
    productId,
    price,
    shipping: feeText == null ? null : parsePrice(feeText),
    shopRating: parsePrice(li.querySelector('.merchant-box .rating')?.textContent),
    shopReviews: reviewsMatch ? Number(reviewsMatch[0]) : 0,
    marketplace: li.querySelector('.add-to-cart-btn') !== null,
    sponsored: li.getAttribute(SPONSORED_ATTR) === 'true',
  };
}

/** Parse the `shops_list` drawer HTML into offers, cheapest first. */
export function parseShopsList(html: string): Offer[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const byKey = new Map<string, Offer>();
  for (const li of doc.querySelectorAll('li[id^="shop-"]')) {
    const o = parseCard(li);
    if (!o) continue;
    const key = `${o.shopId}:${o.productId}`;
    const prev = byKey.get(key);
    if (!prev || (prev.sponsored && !o.sponsored)) byKey.set(key, o);
  }
  return [...byKey.values()].sort((a, b) => a.price - b.price);
}
