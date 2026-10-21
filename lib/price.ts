/** Parse a Greek-formatted price ("1.007,45 €", "Δωρεάν") into euros. */
export function parsePrice(s: string | null | undefined): number | null {
  if (s == null) return null;
  const text = String(s).trim();
  if (/^δωρεάν$/i.test(text) || /^δωρεαν$/i.test(text)) return 0;
  const m = text.match(/[0-9][0-9.]*(?:,[0-9]+)?/);
  if (!m) return null;
  const n = Number(m[0].replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
