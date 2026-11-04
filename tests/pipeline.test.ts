import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAd } from '../lib/normalize';
import { buildCompanies } from '../lib/aggregate';
import { demoResult } from '../lib/demo';
import type { Ad } from '../lib/types';

const today = new Date('2026-11-04T00:00:00Z');
const sec = (daysAgo: number) => Math.floor((today.getTime() - daysAgo * 864e5) / 1000);

test('both snake_case and camelCase scraper output are understood', () => {
  const a = normalizeAd({ ad_archive_id: '1', page_id: '9', page_name: 'X', start_date: sec(10), publisher_platform: ['FACEBOOK'], snapshot: { body: { text: 'Hi' } } }, today)!;
  const b = normalizeAd({ adArchiveID: '2', pageID: '9', pageName: 'X', startDateFormatted: '2026-10-25T00:00:00Z', publisherPlatform: ['INSTAGRAM'], snapshot: { body: { markup: { __html: 'Hi<br>there' } } } }, today)!;
  assert.equal(a.daysRunning, 10);
  assert.deepEqual(a.platforms, ['Facebook']);
  assert.equal(b.startDate, '2026-10-25');
  assert.equal(b.text, 'Hi\nthere');
});

test('ads are grouped per advertiser and non-Jaipur advertisers are removed', () => {
  const items = [
    { ad_archive_id: '1', page_id: 'a', page_name: 'Jaipur Realty', is_active: true, start_date: sec(100), publisher_platform: ['FACEBOOK'], snapshot: { body: { text: 'Plots in Jaipur 302017. Call 98290 12345' }, link_url: 'https://realty.in' } },
    { ad_archive_id: '2', page_id: 'a', page_name: 'Jaipur Realty', is_active: true, start_date: sec(5), publisher_platform: ['INSTAGRAM'], snapshot: { body: { text: 'New launch' } } },
    { ad_archive_id: '2', page_id: 'a', page_name: 'Jaipur Realty', is_active: true, start_date: sec(5), publisher_platform: ['INSTAGRAM'], snapshot: { body: { text: 'duplicate' } } },
    { ad_archive_id: '3', page_id: 'b', page_name: 'Delhi Mart', is_active: true, start_date: sec(5), publisher_platform: ['FACEBOOK'], snapshot: { body: { text: 'Sale in Delhi' } } },
  ];
  const r = buildCompanies(items.map((i) => normalizeAd(i, today)).filter(Boolean) as Ad[], 'live', today);
  assert.equal(r.adsChecked, 3);
  assert.equal(r.rejected, 1);
  assert.equal(r.companies.length, 1);
  const c = r.companies[0];
  assert.equal(c.totalAds, 2);
  assert.deepEqual(c.contacts.phones, ['+91 98290 12345']);
  assert.deepEqual(c.contacts.websites, ['https://realty.in']);
  assert.equal(c.category, 'Real estate');
});

test('demo data runs through the same pipeline and stays fictional', () => {
  const r = demoResult(today);
  assert.equal(r.companies.length, 22);
  assert.equal(r.rejected, 1);
  for (const c of r.companies) {
    for (const p of c.contacts.phones) assert.match(p, /^\+91 00000 /);
    for (const w of c.contacts.websites) assert.match(w, /\.example$/);
  }
});

test('every sample company is placed on a known Jaipur area', async () => {
  const { coordsFor } = await import('../lib/areas');
  for (const c of demoResult(today).companies) {
    assert.ok(c.area, `${c.name} has an area`);
    assert.ok(coordsFor(c.area), `${c.area} has map coordinates`);
  }
});
