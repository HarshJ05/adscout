import type { ScanResult } from './types';

/** A compact copy of one search, kept so later searches can be compared with it. */
export interface Snapshot {
  scannedAt: string;
  mode: ScanResult['mode'];
  /** City id; older saved searches without one were Jaipur */
  city?: string;
  adsChecked: number;
  companies: { id: string; name: string; category: string; area: string | null; score: number; activeAds: number }[];
}

export const MAX_SNAPSHOTS = 12;

export function toSnapshot(r: ScanResult): Snapshot {
  return {
    scannedAt: r.scannedAt,
    mode: r.mode,
    city: r.city,
    adsChecked: r.adsChecked,
    companies: r.companies.map((c) => ({ id: c.id, name: c.name, category: c.category, area: c.area, score: c.score, activeAds: c.activeAds })),
  };
}

/** Newest first, one entry per search, capped. */
export function addSnapshot(list: Snapshot[], s: Snapshot): Snapshot[] {
  return [s, ...list.filter((x) => x.scannedAt !== s.scannedAt)].slice(0, MAX_SNAPSHOTS);
}

export interface Change {
  id: string;
  name: string;
  category: string;
  area: string | null;
  before: number;
  after: number;
}

export interface Comparison {
  added: Snapshot['companies'];
  stopped: Snapshot['companies'];
  rising: Change[];
  falling: Change[];
}

/** What changed between an older search and a newer one. */
export function compare(older: Snapshot, newer: Snapshot): Comparison {
  const prev = new Map(older.companies.map((c) => [c.id, c]));
  const next = new Map(newer.companies.map((c) => [c.id, c]));
  const added = newer.companies.filter((c) => !prev.has(c.id));
  const stopped = older.companies.filter((c) => !next.has(c.id));
  const changes: Change[] = [];
  for (const c of newer.companies) {
    const p = prev.get(c.id);
    if (p && p.score !== c.score) changes.push({ id: c.id, name: c.name, category: c.category, area: c.area, before: p.score, after: c.score });
  }
  return {
    added: added.sort((a, b) => b.score - a.score),
    stopped: stopped.sort((a, b) => b.score - a.score),
    rising: changes.filter((c) => c.after > c.before).sort((a, b) => b.after - b.before - (a.after - a.before)),
    falling: changes.filter((c) => c.after < c.before).sort((a, b) => a.after - a.before - (b.after - b.before)),
  };
}

/**
 * Sample history for Demo mode: two earlier, clearly fictional searches built
 * from the sample data, so the History page can be shown without waiting weeks.
 */
export function sampleHistory(latest: Snapshot): Snapshot[] {
  const day = 864e5;
  const t = Date.parse(latest.scannedAt);
  const shift = (weeksAgo: number, keep: (i: number) => boolean, delta: (i: number) => number): Snapshot => ({
    scannedAt: new Date(t - weeksAgo * 7 * day).toISOString(),
    mode: 'demo',
    city: latest.city,
    adsChecked: Math.round(latest.adsChecked * (1 - weeksAgo * 0.12)),
    companies: latest.companies
      .filter((_, i) => keep(i))
      .map((c, i) => ({ ...c, score: Math.max(5, Math.min(100, c.score + delta(i))), activeAds: Math.max(1, c.activeAds - weeksAgo) })),
  });
  // A fictional advertiser that was running ads in earlier weeks and has since stopped.
  const gone = { id: 'demo-gone-1', name: 'Corner Sweets House', category: 'Restaurants & cafes', area: null, score: 41, activeAds: 2 };
  const withGone = (s: Snapshot): Snapshot => ({ ...s, companies: [...s.companies, gone] });
  return [
    latest,
    withGone(shift(1, (i) => i % 7 !== 3, (i) => (i % 3 === 0 ? -9 : i % 4 === 0 ? 6 : -3))),
    withGone(shift(2, (i) => i % 5 !== 2 && i % 7 !== 3, (i) => (i % 2 === 0 ? -14 : -5))),
  ];
}
