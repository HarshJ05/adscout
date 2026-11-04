import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkJaipur } from '../lib/jaipur';

test('city name, PIN code and area give a High match', () => {
  const r = checkJaipur('Plots in Vaishali Nagar, Jaipur 302021');
  assert.equal(r.level, 'High');
  assert.equal(r.points, 8);
});

test('Hindi city name is recognised', () => {
  assert.equal(checkJaipur('जयपुर में नया शोरूम').points, 3);
});

test('Jaipur landline 0141 counts as a signal', () => {
  assert.ok(checkJaipur('Call 0141-2345678').signals.includes('Jaipur landline (0141)'));
});

test('the same area written two ways is counted once', () => {
  const r = checkJaipur('C-Scheme and C Scheme');
  assert.equal(r.signals.filter((s) => s.startsWith('Jaipur area')).length, 1);
});

test('another city gets zero points', () => {
  assert.equal(checkJaipur('Luxury flats in Dwarka, New Delhi').points, 0);
});
