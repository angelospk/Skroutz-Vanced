import { describe, expect, it } from 'vitest';
import shop from './fixtures/shop_listing.json';
import category from './fixtures/category_listing.json';
import { listingJsonUrl, parseListing, priceGraphUrl, shopsListUrl } from '../lib/listing';

describe('parseListing', () => {
  it('parses a shop storefront page', () => {
    const p = parseListing(shop);
    expect(p.type).toBe('storefront_listing');
    expect(p.currentPage).toBe(1);
    expect(p.totalPages).toBe(509);
    expect(p.items).toHaveLength(12);
    expect(p.items[0]).toMatchObject({
      skuId: 70154067,
      price: 14.7,
      reviewScore: 4.6,
      reviewsCount: 162,
      categoryId: 2652,
      sponsored: false,
      name: 'Samsung USB 2.0 USB-C male - USB-C 100W 1.8m (EP-DX510JBEGEU)',
    });
    expect(p.items[0].url).toMatch(/^\/s\/70154067\/[^?]+\.html$/);
    expect(p.items[0].slug).toBe(p.items[0].url.replace(/^\/s\/70154067\//, '').replace(/\.html$/, ''));
  });

  it('parses prices over 1000 and flags sponsored cards', () => {
    const p = parseListing(category);
    expect(p.totalPages).toBe(23);
    expect(p.items[0].price).toBe(1007.45);
    expect(p.items.filter((i) => i.sponsored)).toHaveLength(4);
    // query string (tracking, sponsored markers) never leaks into url
    expect(p.items.every((i) => !i.url.includes('?'))).toBe(true);
  });

  it('returns an empty page for a malformed response', () => {
    expect(parseListing({}).items).toEqual([]);
    expect(parseListing(null).totalPages).toBe(0);
  });
});

describe('urls', () => {
  it('priceGraphUrl', () => {
    expect(priceGraphUrl(59304245, 'Samsung-Galaxy')).toBe(
      '/s/59304245/Samsung-Galaxy/price_graph?currency=EUR&shipping_country=GR',
    );
    // slug is not checked by the server; an empty slug must still give a valid path
    expect(priceGraphUrl(1, '')).toBe('/s/1/x/price_graph?currency=EUR&shipping_country=GR');
  });

  it('shopsListUrl', () => {
    expect(shopsListUrl(59304245)).toBe('/s/59304245/shops_list');
  });

  it.each([
    ['https://www.skroutz.gr/c/40/kinhta-thlefwna.html', 1, '/c/40/kinhta-thlefwna.json?page=1'],
    ['https://www.skroutz.gr/c/40/kinhta-thlefwna.html?o=a56&page=3', 2, '/c/40/kinhta-thlefwna.json?o=a56&page=2'],
    ['https://www.skroutz.gr/shop/24271/T-support/products.html?from=sku_page', 5, '/shop/24271/T-support/products.json?from=sku_page&page=5'],
    ['https://www.skroutz.gr/c/444/air-fryers.html#top', 1, '/c/444/air-fryers.json?page=1'],
  ])('listingJsonUrl(%s, %d)', (url, page, out) => {
    expect(listingJsonUrl(url, page)).toBe(out);
  });
});
