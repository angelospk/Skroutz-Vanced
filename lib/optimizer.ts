import type { CartLine, CartPlan, Offer } from './types';

export interface CartTotal {
  total: number;
  itemsTotal: number;
  shippingTotal: number;
}

/** Total of a choice (skuId -> offer). Each shop charges its highest fee once. */
export function cartTotal(lines: CartLine[], choice: Record<number, Offer>): CartTotal {
  let itemsTotal = 0;
  const shipByShop = new Map<number, number>();
  for (const line of lines) {
    const o = choice[line.skuId];
    if (!o) continue;
    itemsTotal += o.price * line.quantity;
    shipByShop.set(o.shopId, Math.max(shipByShop.get(o.shopId) ?? 0, o.shipping ?? 0));
  }
  let shippingTotal = 0;
  for (const s of shipByShop.values()) shippingTotal += s;
  return { total: itemsTotal + shippingTotal, itemsTotal, shippingTotal };
}

export interface PlanOptions {
  marketplaceOnly?: boolean;
  maxOffersPerLine?: number;
}

const EPS = 1e-9;

/** Cheapest way to buy every line, accounting for per-shop shipping. Exact branch and bound. */
export function planCheapestCart(lines: CartLine[], opts: PlanOptions = {}): CartPlan | null {
  const { marketplaceOnly = true, maxOffersPerLine = 8 } = opts;
  if (lines.length === 0) return { total: 0, itemsTotal: 0, shippingTotal: 0, choice: {}, shopIds: [] };

  const eligible = lines.map((l) =>
    l.offers.filter((o) => !marketplaceOnly || o.marketplace).sort((a, b) => a.price - b.price),
  );
  if (eligible.some((e) => e.length === 0)) return null;

  // Prune: cheapest K per line, plus offers from any shop that is a top candidate on another line.
  const top = eligible.map((e) => e.slice(0, maxOffersPerLine));
  const topShops = top.map((t) => new Set(t.map((o) => o.shopId)));
  const cands = eligible.map((e, i) =>
    e.filter((o, idx) => {
      if (idx < maxOffersPerLine) return true;
      return topShops.some((s, j) => j !== i && s.has(o.shopId));
    }),
  );

  // Fewest candidates first.
  const order = lines.map((_, i) => i).sort((a, b) => cands[a]!.length - cands[b]!.length);
  const n = order.length;
  const qty = order.map((i) => lines[i]!.quantity);
  const opt = order.map((i) => cands[i]!);

  const remMin = new Array<number>(n + 1).fill(0);
  for (let k = n - 1; k >= 0; k--) remMin[k] = remMin[k + 1]! + opt[k]![0]!.price * qty[k]!;

  // Greedy incumbent.
  const greedy = opt.map((o) => o[0]!);
  let bestCost = 0;
  {
    const ship = new Map<number, number>();
    greedy.forEach((o, k) => {
      bestCost += o.price * qty[k]!;
      ship.set(o.shopId, Math.max(ship.get(o.shopId) ?? 0, o.shipping ?? 0));
    });
    for (const s of ship.values()) bestCost += s;
  }
  let bestPick = greedy.slice();

  const shipMax = new Map<number, number>();
  const pick = new Array<Offer>(n);

  const dfs = (k: number, cost: number) => {
    if (k === n) {
      if (cost < bestCost - EPS) {
        bestCost = cost;
        bestPick = pick.slice();
      }
      return;
    }
    for (const o of opt[k]!) {
      const itemCost = o.price * qty[k]!;
      // Offers are price-sorted, so once the bound fails every later one fails too.
      if (cost + itemCost + remMin[k + 1]! >= bestCost - EPS) break;
      const prev = shipMax.get(o.shopId) ?? 0;
      const fee = o.shipping ?? 0;
      const extra = fee > prev ? fee - prev : 0;
      if (cost + itemCost + extra + remMin[k + 1]! >= bestCost - EPS) continue;
      if (extra > 0) shipMax.set(o.shopId, fee);
      pick[k] = o;
      dfs(k + 1, cost + itemCost + extra);
      if (extra > 0) {
        if (prev === 0) shipMax.delete(o.shopId);
        else shipMax.set(o.shopId, prev);
      }
    }
  };
  dfs(0, 0);

  const choice: Record<number, Offer> = {};
  order.forEach((lineIdx, k) => {
    choice[lines[lineIdx]!.skuId] = bestPick[k]!;
  });
  const t = cartTotal(lines, choice);
  const shopIds = [...new Set(Object.values(choice).map((o) => o.shopId))].sort((a, b) => a - b);
  return { ...t, choice, shopIds };
}
