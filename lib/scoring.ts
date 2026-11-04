import type { Ad, ScoreParts, Tier } from './types';

/**
 * Performance Score (0-100). Meta does not publish spend or results for
 * ordinary business ads in India, so the score uses signals that ARE public
 * and that marketers treat as signs an ad is working:
 *
 *  Activity  (35) – how many ads are live right now. More live ads = bigger, active budget.
 *  Longevity (30) – how long the longest live ad has been running. Advertisers stop ads
 *                   that lose money, so an ad running for months is very likely profitable.
 *  Reach     (15) – how many platforms the ads run on (Facebook, Instagram, Messenger…).
 *  Freshness (20) – how many new ads started in the last 30 days. Shows ongoing testing.
 *
 * Each part uses a soft curve so one very large advertiser does not flatten everyone else.
 */
export const WEIGHTS = { activity: 35, longevity: 30, reach: 15, freshness: 20 } as const;
export const CAPS = { activeAds: 20, days: 180, platforms: 3, newAds: 5 } as const;

const logCurve = (v: number, cap: number) => Math.min(1, Math.log1p(Math.max(0, v)) / Math.log1p(cap));

export function scoreCompany(ads: Ad[], today = new Date()) {
  const live = ads.filter((a) => a.isActive);
  const activeAds = live.reduce((s, a) => s + Math.max(1, a.variations), 0);
  const longestRunningDays = live.reduce((m, a) => Math.max(m, a.daysRunning), 0);
  const platforms = Array.from(new Set(ads.flatMap((a) => a.platforms)));
  const cutoff = today.getTime() - 30 * 864e5;
  const newAds30d = ads.filter((a) => a.startDate && Date.parse(a.startDate) >= cutoff).length;

  const parts: ScoreParts = {
    activity: Math.round(WEIGHTS.activity * logCurve(activeAds, CAPS.activeAds)),
    longevity: Math.round(WEIGHTS.longevity * logCurve(longestRunningDays, CAPS.days)),
    reach: Math.round(WEIGHTS.reach * Math.min(1, platforms.length / CAPS.platforms)),
    freshness: Math.round(WEIGHTS.freshness * Math.min(1, newAds30d / CAPS.newAds)),
  };
  const score = parts.activity + parts.longevity + parts.reach + parts.freshness;
  return { score, parts, activeAds, longestRunningDays, platforms, newAds30d, tier: tierOf(score) };
}

export function tierOf(score: number): Tier {
  if (score >= 75) return 'Top performer';
  if (score >= 50) return 'Strong';
  if (score >= 25) return 'Moderate';
  return 'Getting started';
}
