import { storage } from 'wxt/utils/storage';
import type { Period } from './types';

export interface Settings {
  /** History window used for the bars and the deal ranking. */
  period: Period;
  hideSponsored: boolean;
  showMarketBar: boolean;
  showHistoryBar: boolean;
  /** 'click': chart opens from the bars; 'never': no chart button. */
  chart: 'click' | 'never';
  /** A shop price this much over the market low is shown fully red. */
  marketRedPct: number;
  /** Max listing pages one "Τι αξίζει εδώ" scan reads. */
  scanMaxPages: number;
  /**
   * Request rate to Skroutz. Cloudflare bans the IP for a while (error 1015)
   * when a scan goes much faster; 1/s is safe.
   */
  requestsPerSecond: number;
  altMinReviewScore: number;
  altMinReviews: number;
  /** Let the cart planner use shops that sell outside the Skroutz cart. */
  includeOffsite: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  period: '6_months',
  hideSponsored: true,
  showMarketBar: true,
  showHistoryBar: true,
  chart: 'click',
  marketRedPct: 20,
  scanMaxPages: 3,
  requestsPerSecond: 1,
  altMinReviewScore: 4,
  altMinReviews: 5,
  includeOffsite: false,
};

export const settingsItem = storage.defineItem<Settings>('local:settings', {
  fallback: DEFAULT_SETTINGS,
});

export async function loadSettings(): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...(await settingsItem.getValue()) };
}

export const PERIOD_DAYS: Record<Period, number> = {
  '1_months': 30,
  '3_months': 90,
  '6_months': 180,
  all: Infinity,
};

export const PERIOD_LABEL: Record<Period, string> = {
  '1_months': '1 μήνας',
  '3_months': '3 μήνες',
  '6_months': '6 μήνες',
  all: 'Όλα',
};
