import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkCity, areaFromSignals } from '../lib/geo';
import { CITIES, cityById, coordsIn } from '../lib/cities';
import { formatPhone } from '../lib/contacts';

const jaipur = cityById('jaipur');

test('Jaipur: city name, PIN code and area give a High match', () => {
  const r = checkCity('Plots in Vaishali Nagar, Jaipur 302021', jaipur);
  assert.equal(r.level, 'High');
  assert.equal(r.points, 8);
  assert.equal(areaFromSignals(r.signals), 'Vaishali Nagar');
});

test('Hindi city names are recognised', () => {
  assert.equal(checkCity('जयपुर में नया शोरूम', jaipur).points, 3);
  assert.equal(checkCity('नई दिल्ली में ऑफर', cityById('delhi')).points, 3);
});

test('landlines count for each city', () => {
  assert.ok(checkCity('Call 0141-2345678', jaipur).signals.includes('Jaipur landline (0141)'));
  assert.ok(checkCity('Call 022 2345 6789', cityById('mumbai')).signals.includes('Mumbai landline (022)'));
  assert.equal(formatPhone('011-2345 6789'), '+91 11 2345 6789');
  assert.equal(formatPhone('0141 234 5678'), '+91 141 234 5678');
});

test('the same area written two ways is counted once', () => {
  const r = checkCity('C-Scheme and C Scheme', jaipur);
  assert.equal(r.signals.filter((s) => s.startsWith('Area: ')).length, 1);
});

test('a business from another city gets zero points', () => {
  assert.equal(checkCity('Luxury flats in Dwarka, New Delhi', jaipur).points, 0);
  assert.ok(checkCity('Luxury flats in Dwarka, New Delhi', cityById('delhi')).points >= 5);
  assert.equal(checkCity('Cafe in Koramangala, Bengaluru 560034', cityById('pune')).points, 0);
});

test('old city names work: Bombay, Bangalore', () => {
  assert.ok(checkCity('Bombay sale', cityById('mumbai')).points > 0);
  assert.ok(checkCity('Bangalore offer', cityById('bengaluru')).points > 0);
});

test('every city has areas inside its own map bounds', () => {
  for (const c of CITIES) {
    assert.ok(Object.keys(c.areas).length >= 20, `${c.name} has 20+ areas`);
    for (const [name, [lat, lng]] of Object.entries(c.areas)) {
      const pad = 0.04;
      assert.ok(lat <= c.bounds.n + pad && lat >= c.bounds.s - pad && lng >= c.bounds.w - pad && lng <= c.bounds.e + pad, `${c.name}: ${name} near bounds`);
    }
    for (const alias of Object.keys(c.areaAliases ?? {})) assert.ok(coordsIn(c, alias), `${c.name}: alias ${alias} resolves`);
  }
});

test('sample data works in every city: local companies kept, the other-city decoy removed, areas on the map', async () => {
  const { demoResult } = await import('../lib/demo');
  for (const c of CITIES) {
    const r = demoResult(new Date('2026-11-13T00:00:00Z'), c);
    assert.equal(r.city, c.id);
    assert.equal(r.companies.length, 22, `${c.name}: 22 companies`);
    assert.equal(r.rejected, 1, `${c.name}: decoy removed`);
    for (const co of r.companies) assert.ok(coordsIn(c, co.area), `${c.name}: ${co.name} placed (${co.area})`);
  }
});
