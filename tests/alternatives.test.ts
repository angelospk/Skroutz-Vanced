import { describe, expect, it } from 'vitest';
import { keyphraseFor, normalizeTitle, rankAlternatives, titleSimilarity } from '../lib/alternatives';
import type { ListingItem } from '../lib/types';

function item(skuId: number, name: string, price: number | null, extra: Partial<ListingItem> = {}): ListingItem {
  return {
    skuId,
    name,
    slug: 'x',
    url: `/s/${skuId}/x.html`,
    price,
    reviewScore: 4.6,
    reviewsCount: 50,
    categoryId: 2652,
    sponsored: false,
    imageUrl: null,
    ...extra,
  };
}

describe('normalizeTitle', () => {
  it('lowercases, strips Greek accents and punctuation', () => {
    expect(normalizeTitle('Καλώδιο USB-C (1.8m) Μαύρο!')).toEqual(['καλωδιο', 'usb', 'c', '1.8m', 'μαυρο']);
  });
  it('turns final sigma into sigma', () => {
    expect(normalizeTitle('Φορτιστής')).toEqual(['φορτιστησ']);
  });
});

describe('titleSimilarity', () => {
  it('is 1 for the same title and 0 for unrelated titles', () => {
    expect(titleSimilarity('Samsung USB-C cable 1m', 'samsung usb c Cable 1M')).toBe(1);
    expect(titleSimilarity('Samsung USB-C cable', 'Philips airfryer XL')).toBe(0);
  });
  it('is between 0 and 1 for related titles', () => {
    const s = titleSimilarity('Baseus USB-C to USB-C cable 100W 1m', 'Ugreen USB-C to USB-C cable 60W 1m');
    expect(s).toBeGreaterThan(0.3);
    expect(s).toBeLessThan(1);
  });
});

describe('keyphraseFor', () => {
  it('keeps at most 5 meaningful words and drops colours and codes in parentheses', () => {
    expect(keyphraseFor('Samsung USB 2.0 Cable USB-C male - USB-C 100W Μαύρο 1.8m (EP-DX510JBEGEU)')).toBe(
      'samsung usb 2.0 cable usb',
    );
  });
});

describe('rankAlternatives', () => {
  const target = item(1, 'Samsung USB-C to USB-C cable 100W 1.8m Black', 14.7);

  it('returns cheaper, similar, well-reviewed items of the same category, cheapest first', () => {
    const cands = [
      item(2, 'Baseus USB-C to USB-C cable 100W 2m', 6.6),
      item(3, 'Ugreen USB-C to USB-C cable 100W 1m', 7.2),
      item(4, 'Philips airfryer XL', 5), // unrelated
      item(5, 'Cheap USB-C to USB-C cable 100W', 3, { reviewScore: 2.1 }), // bad reviews
      item(6, 'Noname USB-C to USB-C cable 100W 1m', 4, { reviewsCount: 1 }), // too few reviews
      item(7, 'Anker USB-C to USB-C cable 100W 1.8m', 20), // more expensive
      item(8, 'Spigen USB-C to USB-C cable 100W', 5, { categoryId: 999 }), // other category
      item(9, 'Samsung USB-C to USB-C cable 100W 1.8m Black', 14.7), // same price
      item(1, 'Samsung USB-C to USB-C cable 100W 1.8m Black', 10), // the target itself
      item(10, 'Sponsored USB-C to USB-C cable 100W', 6, { sponsored: true }),
      item(11, 'USB-C to USB-C cable 100W no price', null),
    ];
    const r = rankAlternatives(target, cands);
    expect(r.map((x) => x.item.skuId)).toEqual([10, 2, 3]);
    expect(r[1].saving).toBeCloseTo(8.1, 5);
    expect(r[1].similarity).toBeGreaterThan(0.3);
  });

  it('honours custom thresholds and can exclude sponsored items', () => {
    const cands = [item(5, 'Cheap USB-C to USB-C cable 100W', 3, { reviewScore: 2.1 }), item(10, 'Sp USB-C to USB-C cable 100W', 6, { sponsored: true })];
    const r = rankAlternatives(target, cands, { minReviewScore: 0, minReviews: 0, includeSponsored: false });
    expect(r.map((x) => x.item.skuId)).toEqual([5]);
  });

  it('keeps items without a review score only when minReviewScore is 0', () => {
    const cands = [item(2, 'Baseus USB-C to USB-C cable 100W 2m', 6.6, { reviewScore: null, reviewsCount: 0 })];
    expect(rankAlternatives(target, cands)).toEqual([]);
    expect(rankAlternatives(target, cands, { minReviewScore: 0, minReviews: 0 })).toHaveLength(1);
  });
});
