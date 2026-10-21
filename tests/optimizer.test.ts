import { describe, expect, it } from 'vitest';
import { cartTotal, planCheapestCart } from '../lib/optimizer';
import type { CartLine, Offer } from '../lib/types';

function offer(shopId: number, price: number, shipping: number | null = 0, extra: Partial<Offer> = {}): Offer {
  return {
    shopId,
    shopName: `shop${shopId}`,
    productId: shopId * 1000 + Math.round(price),
    price,
    shipping,
    shopRating: 4.5,
    shopReviews: 10,
    marketplace: true,
    sponsored: false,
    ...extra,
  };
}

function line(skuId: number, offers: Offer[], quantity = 1, shopId: number | null = null): CartLine {
  return { skuId, quantity, shopId, offers };
}

describe('cartTotal', () => {
  it('charges each shop shipping once (the highest fee among its lines)', () => {
    const a = offer(1, 10, 3);
    const b = offer(1, 20, 4);
    const c = offer(2, 5, 2);
    const t = cartTotal([line(1, [a]), line(2, [b]), line(3, [c])], { 1: a, 2: b, 3: c });
    expect(t.itemsTotal).toBe(35);
    expect(t.shippingTotal).toBe(6); // shop1: max(3,4)=4, shop2: 2
    expect(t.total).toBe(41);
  });

  it('multiplies price by quantity and treats unknown shipping as 0', () => {
    const a = offer(1, 10, null);
    expect(cartTotal([line(1, [a], 3)], { 1: a }).total).toBe(30);
  });
});

describe('planCheapestCart', () => {
  it('picks the cheapest offer per line when shipping is free', () => {
    const plan = planCheapestCart([
      line(1, [offer(1, 10), offer(2, 9)]),
      line(2, [offer(1, 5), offer(3, 6)]),
    ])!;
    expect(plan.choice[1].shopId).toBe(2);
    expect(plan.choice[2].shopId).toBe(1);
    expect(plan.total).toBe(14);
    expect(plan.shopIds.sort()).toEqual([1, 2]);
  });

  it('consolidates into one shop when that saves shipping', () => {
    // Cheapest per line: A from shop2 (9+5), B from shop3 (9+5) = 28.
    // All from shop1: 10 + 10 + 5 shipping = 25.
    const plan = planCheapestCart([
      line(1, [offer(1, 10, 5), offer(2, 9, 5)]),
      line(2, [offer(1, 10, 5), offer(3, 9, 5)]),
    ])!;
    expect(plan.total).toBe(25);
    expect(plan.shopIds).toEqual([1]);
  });

  it('ignores off-site offers by default and can include them', () => {
    const lines = [line(1, [offer(1, 10), offer(2, 5, 0, { marketplace: false })])];
    expect(planCheapestCart(lines)!.choice[1].shopId).toBe(1);
    expect(planCheapestCart(lines, { marketplaceOnly: false })!.choice[1].shopId).toBe(2);
  });

  it('returns null when a line has no eligible offer', () => {
    expect(planCheapestCart([line(1, [offer(1, 5, 0, { marketplace: false })])])).toBeNull();
    expect(planCheapestCart([line(1, [])])).toBeNull();
  });

  it('returns an empty plan for an empty cart', () => {
    expect(planCheapestCart([])).toEqual({ total: 0, itemsTotal: 0, shippingTotal: 0, choice: {}, shopIds: [], exact: true });
  });

  it('finds a cheap offer that sits behind many cheaper-priced offers with high shipping', () => {
    // Eight offers at 10-17 € with 100 € shipping, a ninth at 18 € with free shipping.
    const offers = [...Array.from({ length: 8 }, (_, i) => offer(i + 1, 10 + i, 100)), offer(9, 18, 0)];
    const plan = planCheapestCart([line(1, offers)])!;
    expect(plan.total).toBe(18);
    expect(plan.exact).toBe(true);
  });

  it('stops at the node budget and says the plan is not exact', () => {
    const lines = Array.from({ length: 10 }, (_, i) =>
      line(i + 1, Array.from({ length: 10 }, (_, s) => offer(s + 1, 10 + ((i + s) % 3), 5))),
    );
    const plan = planCheapestCart(lines, { maxNodes: 50 })!;
    expect(plan.exact).toBe(false);
    expect(cartTotal(lines, plan.choice).total).toBeCloseTo(plan.total, 6);
  });

  it('respects quantity', () => {
    const plan = planCheapestCart([line(1, [offer(1, 10, 1), offer(2, 9, 4)], 3)])!;
    // shop1: 30+1=31, shop2: 27+4=31 -> tie; either is fine but total must be 31
    expect(plan.total).toBe(31);
  });

  it('matches brute force on random carts', () => {
    let seed = 42;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    for (let round = 0; round < 60; round++) {
      const nLines = 1 + Math.floor(rnd() * 5);
      const nShops = 2 + Math.floor(rnd() * 5);
      const shipping: Record<number, number> = {};
      for (let s = 1; s <= nShops; s++) shipping[s] = [0, 2.5, 3.5, 5][Math.floor(rnd() * 4)];
      const lines = Array.from({ length: nLines }, (_, i) => {
        const offers: Offer[] = [];
        for (let s = 1; s <= nShops; s++) {
          if (rnd() < 0.7) offers.push(offer(s, Math.round((5 + rnd() * 20) * 100) / 100, shipping[s]));
        }
        if (offers.length === 0) offers.push(offer(1, 10, shipping[1]));
        return line(i + 1, offers, 1 + Math.floor(rnd() * 2));
      });
      // brute force
      let best = Infinity;
      const pick = (i: number, choice: Record<number, Offer>) => {
        if (i === lines.length) {
          best = Math.min(best, cartTotal(lines, choice).total);
          return;
        }
        for (const o of lines[i].offers) pick(i + 1, { ...choice, [lines[i].skuId]: o });
      };
      pick(0, {});
      const plan = planCheapestCart(lines)!;
      expect(plan.exact).toBe(true);
      expect(plan.total).toBeCloseTo(best, 6);
      expect(cartTotal(lines, plan.choice).total).toBeCloseTo(plan.total, 6);
    }
  });

  it('finishes quickly on a large cart', () => {
    const lines = Array.from({ length: 12 }, (_, i) =>
      line(i + 1, Array.from({ length: 30 }, (_, s) => offer(s + 1, 10 + ((i * 7 + s * 13) % 17), (s % 4) * 1.5))),
    );
    const t0 = performance.now();
    const plan = planCheapestCart(lines);
    expect(plan).not.toBeNull();
    expect(performance.now() - t0).toBeLessThan(2000);
  });
});
