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
  /** Search budget. Past it the best plan found so far is returned with exact = false. */
  maxNodes?: number;
}

const EPS = 1e-9;

/** Cheapest way to buy every line, accounting for per-shop shipping. Exact branch and bound. */
export function planCheapestCart(lines: CartLine[], opts: PlanOptions = {}): CartPlan | null {
  const { marketplaceOnly = true, maxNodes = 200_000 } = opts;
  if (lines.length === 0) return { total: 0, itemsTotal: 0, shippingTotal: 0, choice: {}, shopIds: [], exact: true };

  const cands = lines.map((l) =>
    l.offers.filter((o) => !marketplaceOnly || o.marketplace).sort((a, b) => a.price - b.price),
  );
  if (cands.some((e) => e.length === 0)) return null;

  // Fewest candidates first.
  const order = lines.map((_, i) => i).sort((a, b) => cands[a].length - cands[b].length);
  const n = order.length;
  const qty = order.map((i) => lines[i].quantity);
  const opt = order.map((i) => cands[i]);

  const remMin = new Array<number>(n + 1).fill(0);
  for (let k = n - 1; k >= 0; k--) remMin[k] = remMin[k + 1] + opt[k][0].price * qty[k];

  // Incumbent: the best single-offer choice per line by price + shipping.
  let bestPick = opt.map((o, k) =>
    o.reduce((b, x) => (x.price * qty[k] + (x.shipping ?? 0) < b.price * qty[k] + (b.shipping ?? 0) ? x : b)),
  );
  let bestCost = costOf(bestPick, qty);

  const shipMax = new Map<number, number>();
  const pick = new Array<Offer>(n);
  let nodes = 0;
  let exhausted = false;

  const dfs = (k: number, cost: number) => {
    if (k === n) {
      if (cost < bestCost - EPS) {
        bestCost = cost;
        bestPick = pick.slice();
      }
      return;
    }
    for (const o of opt[k]) {
      if (++nodes > maxNodes) {
        exhausted = true;
        return;
      }
      const itemCost = o.price * qty[k];
      // Offers are price-sorted, so once the bound fails every later one fails too.
      if (cost + itemCost + remMin[k + 1] >= bestCost - EPS) break;
      const prev = shipMax.get(o.shopId) ?? 0;
      const fee = o.shipping ?? 0;
      const extra = fee > prev ? fee - prev : 0;
      if (cost + itemCost + extra + remMin[k + 1] >= bestCost - EPS) continue;
      if (extra > 0) shipMax.set(o.shopId, fee);
      pick[k] = o;
      dfs(k + 1, cost + itemCost + extra);
      if (extra > 0) {
        if (prev === 0) shipMax.delete(o.shopId);
        else shipMax.set(o.shopId, prev);
      }
      if (exhausted) return;
    }
  };
  dfs(0, 0);

  const choice: Record<number, Offer> = {};
  order.forEach((lineIdx, k) => {
    choice[lines[lineIdx].skuId] = bestPick[k];
  });
  const t = cartTotal(lines, choice);
  const shopIds = [...new Set(Object.values(choice).map((o) => o.shopId))].sort((a, b) => a - b);
  return { ...t, choice, shopIds, exact: !exhausted };
}

function costOf(picks: Offer[], qty: number[]): number {
  let cost = 0;
  const ship = new Map<number, number>();
  picks.forEach((o, k) => {
    cost += o.price * qty[k];
    ship.set(o.shopId, Math.max(ship.get(o.shopId) ?? 0, o.shipping ?? 0));
  });
  for (const s of ship.values()) cost += s;
  return cost;
}
