// Shared data shapes. Pure types, no runtime code.

/** One daily point of a SKU's lowest market price. `ts` is unix seconds. */
export interface PricePoint {
  ts: number;
  value: number;
}

export type Period = '1_months' | '3_months' | '6_months' | 'all';

export interface HistoryStats {
  min: number;
  max: number;
  mean: number;
  median: number;
  /** Value of the newest point. */
  current: number;
  /** Timestamp (unix seconds) of the newest point whose value equals `min`. */
  minTs: number;
  count: number;
}

/** A product card from a listing JSON (category, search result or shop storefront). */
export interface ListingItem {
  skuId: number;
  name: string;
  /** Path segment between `/s/<id>/` and `.html`. */
  slug: string;
  /** Path of the SKU page without query, e.g. `/s/1/foo.html`. */
  url: string;
  /** Price shown on the card, in euros. On a shop storefront it is that shop's price. */
  price: number | null;
  reviewScore: number | null;
  reviewsCount: number;
  categoryId: number;
  sponsored: boolean;
  imageUrl: string | null;
}

export interface ListingPage {
  items: ListingItem[];
  currentPage: number;
  totalPages: number;
  type: string;
}

/** One shop's offer for a SKU, from the `shops_list` drawer HTML. */
export interface Offer {
  shopId: number;
  shopName: string;
  productId: number;
  price: number;
  /** Shipping fee in euros; 0 for free; null when the card does not show one. */
  shipping: number | null;
  shopRating: number | null;
  shopReviews: number;
  /** True when the offer can go into the Skroutz cart. */
  marketplace: boolean;
  sponsored: boolean;
}

export interface CartLine {
  skuId: number;
  quantity: number;
  /** Shop the line is bought from now. */
  shopId: number | null;
  offers: Offer[];
}

export interface CartPlan {
  total: number;
  itemsTotal: number;
  shippingTotal: number;
  /** skuId -> chosen offer */
  choice: Record<number, Offer>;
  shopIds: number[];
  /** False when the search hit its node budget; the plan is then the best one found. */
  exact: boolean;
}
