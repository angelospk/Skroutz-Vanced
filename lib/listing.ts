import type { ListingItem, ListingPage } from './types';
import { parsePrice } from './price';

const EMPTY: ListingPage = { items: [], currentPage: 0, totalPages: 0, type: '' };

function parseItem(s: any): ListingItem | null {
  const skuId = Number(s?.id);
  if (!Number.isFinite(skuId) || typeof s?.sku_url !== 'string') return null;
  const rawUrl: string = s.sku_url;
  const url = rawUrl.split('#')[0]!.split('?')[0]!;
  const slugMatch = url.match(/\/s\/\d+\/(.*?)(?:\.html)?$/);
  return {
    skuId,
    name: String(s.name ?? ''),
    url,
    slug: slugMatch ? slugMatch[1]! : '',
    price: parsePrice(s.price),
    reviewScore: parsePrice(s.review_score),
    reviewsCount: Number(s.reviews_count) || 0,
    categoryId: Number(s.category_id) || 0,
    imageUrl: s.image_url ?? null,
    sponsored:
      rawUrl.includes('sponsored=') || rawUrl.includes('from=featured') || s.sponsored_product_id != null,
  };
}

export function parseListing(json: unknown): ListingPage {
  const j = json as any;
  if (!j || !Array.isArray(j.skus)) return { ...EMPTY, items: [] };
  const items = j.skus.map(parseItem).filter((i: ListingItem | null): i is ListingItem => i !== null);
  return {
    items,
    currentPage: Number(j.page?.current_page) || 0,
    totalPages: Number(j.page?.total_pages) || 0,
    type: String(j.page?.type ?? ''),
  };
}

export function priceGraphUrl(skuId: number, slug: string): string {
  return `/s/${skuId}/${slug || 'x'}/price_graph?currency=EUR&shipping_country=GR`;
}

export function shopsListUrl(skuId: number): string {
  return `/s/${skuId}/shops_list`;
}

/** Same-origin JSON URL (path + query) of page `page` of a listing page URL. */
export function listingJsonUrl(pageUrl: string, page: number): string {
  const u = new URL(pageUrl, 'https://www.skroutz.gr');
  const path = u.pathname.replace(/\.html$/, '.json');
  const params = [...u.searchParams.entries()].filter(([k]) => k !== 'page');
  params.push(['page', String(page)]);
  const qs = params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  return `${path}?${qs}`;
}
