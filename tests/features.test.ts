import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leadFromCompany, setStatus, countByStatus, fillTemplate, leadsToCsv } from '../lib/leads';
import { addSnapshot, compare, toSnapshot, sampleHistory, MAX_SNAPSHOTS } from '../lib/history';
import { demoResult } from '../lib/demo';
import { inPin } from '../components/landing/field';

const today = new Date('2026-11-13T00:00:00Z');
const demo = demoResult(today);

test('a lead keeps its own copy of the contact details', () => {
  const c = demo.companies[0];
  const l = leadFromCompany(c, true, today);
  assert.equal(l.name, c.name);
  assert.equal(l.phone, c.contacts.phones[0] ?? null);
  assert.equal(l.status, 'new');
  assert.equal(l.sample, true);
});

test('status changes update the time and the counts', () => {
  const c = demo.companies[0];
  let m = { [c.id]: leadFromCompany(c, true, today) };
  m = setStatus(m, c.id, 'interested', new Date('2026-11-14T00:00:00Z'));
  assert.equal(m[c.id].status, 'interested');
  assert.equal(m[c.id].updatedAt.slice(0, 10), '2026-11-14');
  assert.equal(countByStatus(m).interested, 1);
  assert.equal(setStatus(m, 'missing', 'won'), m);
});

test('message templates fill name, business type and area', () => {
  const msg = fillTemplate('Hi {name}, your {category} ads in {area}', { name: 'Pink City Homes', category: 'Real estate', area: 'Jagatpura' });
  assert.equal(msg, 'Hi Pink City Homes, your real estate ads in Jagatpura');
  assert.equal(fillTemplate('{area} {city}', { name: 'x', category: 'y', area: null }, 'Pune'), 'Pune Pune');
});

test('lead CSV escapes commas and quotes', () => {
  const l = { ...leadFromCompany(demo.companies[0], true, today), note: 'Call back, "after 5"' };
  assert.match(leadsToCsv([l]), /"Call back, ""after 5"""/);
});

test('history keeps one entry per search, newest first, capped', () => {
  let h = [] as ReturnType<typeof toSnapshot>[];
  for (let i = 0; i < MAX_SNAPSHOTS + 3; i++) h = addSnapshot(h, { ...toSnapshot(demo), scannedAt: new Date(today.getTime() + i * 864e5).toISOString() });
  assert.equal(h.length, MAX_SNAPSHOTS);
  assert.ok(h[0].scannedAt > h[1].scannedAt);
  assert.equal(addSnapshot(h, h[0]).length, MAX_SNAPSHOTS);
});

test('comparison finds new, stopped, rising and falling advertisers', () => {
  const latest = toSnapshot(demo);
  const [, older] = sampleHistory(latest);
  const cmp = compare(older, latest);
  assert.ok(cmp.added.length > 0, 'some companies are new');
  assert.ok(cmp.rising.length > 0, 'some scores rose');
  assert.ok(cmp.stopped.length > 0, 'someone stopped advertising');
  for (const r of cmp.rising) assert.ok(r.after > r.before);
  for (const f of cmp.falling) assert.ok(f.after < f.before);
  for (const a of cmp.added) assert.ok(!older.companies.some((c) => c.id === a.id));
});

test('map-pin shape: solid head, hollow centre, pointed tail', () => {
  assert.equal(inPin(0, 1.2), true, 'top of the head');
  assert.equal(inPin(0, 0.45), false, 'the hole');
  assert.equal(inPin(0.4, 0.45), false, 'still the hole');
  assert.equal(inPin(0, -1.4), true, 'near the tip');
  assert.equal(inPin(0.8, -1.4), false, 'beside the tip');
  assert.equal(inPin(1.2, 0.45), false, 'outside the head');
});
