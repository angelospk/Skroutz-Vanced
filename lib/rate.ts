export type RateMessage = { type: 'sv:permit' } | { type: 'sv:pause'; ms: number };

/** Milliseconds between request starts for a requests-per-second setting (clamped to 0.2-1/s). */
export function intervalFor(requestsPerSecond: number): number {
  const rps = Number.isFinite(requestsPerSecond) ? Math.max(0.2, Math.min(1, requestsPerSecond)) : 1;
  return Math.round(1000 / rps);
}
