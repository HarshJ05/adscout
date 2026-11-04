import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreCompany, tierOf } from '../lib/scoring';
import type { Ad } from '../lib/types';

const today = new Date('2026-11-04T00:00:00Z');
const ad = (daysAgo: number, platforms: string[], extra: Partial<Ad> = {}): Ad => ({
  id: `a${daysAgo}${platforms.join('')}`, pageId: 'p', pageName: 'P', pageUrl: null, avatarUrl: null, text: '', title: null,
  cta: null, linkUrl: null, imageUrl: null, platforms,
  startDate: new Date(today.getTime() - daysAgo * 864e5).toISOString().slice(0, 10), endDate: null, isActive: true,
  daysRunning: daysAgo, variations: 1, libraryUrl: '', pageCategories: [], aboutText: '', ...extra,
});

test('worked example from the guide scores 65', () => {
  const ads = [ad(90, ['Facebook']), ad(60, ['Instagram']), ad(45, ['Facebook']), ad(10, ['Facebook']), ad(5, ['Instagram'])];
  const s = scoreCompany(ads, today);
  assert.deepEqual(s.parts, { activity: 21, longevity: 26, reach: 10, freshness: 8 });
  assert.equal(s.score, 65);
  assert.equal(s.tier, 'Strong');
});

test('score never exceeds 100', () => {
  const ads = Array.from({ length: 40 }, (_, i) => ad(i < 10 ? 3 : 400, ['Facebook', 'Instagram', 'Messenger', 'Threads']));
  assert.equal(scoreCompany(ads, today).score, 100);
});

test('stopped ads do not count as active', () => {
  const s = scoreCompany([ad(50, ['Facebook'], { isActive: false })], today);
  assert.equal(s.activeAds, 0);
  assert.equal(s.parts.activity, 0);
});

test('tiers', () => {
  assert.equal(tierOf(80), 'Top performer');
  assert.equal(tierOf(50), 'Strong');
  assert.equal(tierOf(30), 'Moderate');
  assert.equal(tierOf(5), 'Getting started');
});
