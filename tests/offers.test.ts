// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseShopsList } from '../lib/offers';

const html = readFileSync(new URL('./fixtures/shops_list_a56.html', import.meta.url), 'utf8');

describe('parseShopsList', () => {
  const offers = parseShopsList(html);

  it('returns one offer per shop+product (sponsored duplicate removed)', () => {
    expect(offers).toHaveLength(17);
    const keys = offers.map((o) => `${o.shopId}:${o.productId}`);
    expect(new Set(keys).size).toBe(17);
  });

  it('keeps the non-sponsored copy of a duplicated card', () => {
    const imshops = offers.find((o) => o.shopId === 28235)!;
    expect(imshops.sponsored).toBe(false);
  });

  it('reads price, shipping, shop rating and name', () => {
    expect(offers.find((o) => o.shopId === 24271)).toEqual({
      shopId: 24271,
      shopName: 'T support',
      productId: 249000737,
      price: 369.6,
      shipping: 0,
      shopRating: 4.9,
      shopReviews: 31,
      marketplace: true,
      sponsored: false,
    });
    const ovolt = offers.find((o) => o.shopId === 24590)!;
    expect(ovolt.shipping).toBe(2.5);
    expect(ovolt.price).toBe(490.9);
  });

  it('handles shops without a rating', () => {
    const isolve = offers.find((o) => o.shopId === 22494)!;
    expect(isolve.shopRating).toBeNull();
    expect(isolve.shopReviews).toBe(0);
    expect(isolve.price).toBe(365);
  });

  it('sorts offers by price ascending', () => {
    const prices = offers.map((o) => o.price);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });

  it('returns [] for unrelated html', () => {
    expect(parseShopsList('<div>nothing</div>')).toEqual([]);
    expect(parseShopsList('')).toEqual([]);
  });
});
