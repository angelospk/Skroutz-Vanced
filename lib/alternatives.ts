import type { ListingItem } from './types';

const COLOURS = new Set(
  'μαυρο ασπρο λευκο μπλε κοκκινο πρασινο γκρι ασημι χρυσο ροζ black white blue red green grey gray silver gold pink'.split(' '),
);

export function normalizeTitle(s: string): string[] {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ς/g, 'σ')
    .split(/[^a-z0-9α-ω.]+/)
    .map((t) => t.replace(/^\.+|\.+$/g, ''))
    .filter((t) => t.length > 0);
}

/** Tokens that define what the product is: power, storage, battery, refresh rate, camera. */
const SPEC = /^[0-9]+(?:\.[0-9]+)?(?:w|gb|tb|mah|hz|mp)$/;

/** Key spec tokens of a title, e.g. "100w", "256gb". */
export function specTokens(title: string): string[] {
  return normalizeTitle(title).filter((t) => SPEC.test(t));
}

/** Jaccard similarity of the two titles' word sets. */
export function titleSimilarity(a: string, b: string): number {
  const sa = new Set(normalizeTitle(a));
  const sb = new Set(normalizeTitle(b));
  if (sa.size === 0 && sb.size === 0) return 0;
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter++;
  return inter / (sa.size + sb.size - inter);
}

/** A short search phrase for a product title. */
export function keyphraseFor(title: string): string {
  return normalizeTitle(title.replace(/\([^)]*\)/g, ' '))
    .filter((t) => t.length > 1 && !COLOURS.has(t))
    .slice(0, 5)
    .join(' ');
}

export interface AlternativeOptions {
  minReviewScore?: number;
  minReviews?: number;
  minSimilarity?: number;
  includeSponsored?: boolean;
}

export interface Alternative {
  item: ListingItem;
  similarity: number;
  saving: number;
}

export function rankAlternatives(
  target: ListingItem,
  candidates: ListingItem[],
  opts: AlternativeOptions = {},
): Alternative[] {
  const { minReviewScore = 4, minReviews = 5, minSimilarity = 0.3, includeSponsored = true } = opts;
  if (target.price === null) return [];
  const targetPrice = target.price;
  const checkReviews = minReviewScore > 0 || minReviews > 0;
  const targetSpecs = specTokens(target.name);
  const out: Alternative[] = [];
  for (const item of candidates) {
    if (item.skuId === target.skuId) continue;
    if (item.price === null || item.price >= targetPrice) continue;
    if (item.categoryId !== target.categoryId) continue;
    if (item.sponsored && !includeSponsored) continue;
    if (checkReviews) {
      if (item.reviewScore === null || item.reviewScore < minReviewScore || item.reviewsCount < minReviews) continue;
    }
    // An alternative must keep every key spec of the target (a 25W cable does not replace a 100W one).
    const specs = new Set(specTokens(item.name));
    if (!targetSpecs.every((s) => specs.has(s))) continue;
    const similarity = titleSimilarity(target.name, item.name);
    if (similarity < minSimilarity) continue;
    out.push({ item, similarity, saving: targetPrice - item.price });
  }
  return out.sort((a, b) => a.item.price! - b.item.price!);
}
