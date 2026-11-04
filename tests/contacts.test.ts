import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractContacts, formatPhone, unwrapFacebookLink } from '../lib/contacts';

test('Indian mobile numbers are normalised', () => {
  assert.equal(formatPhone('+91-98765 43210'), '+91 98765 43210');
  assert.equal(formatPhone('09876543210'), '+91 98765 43210');
  assert.equal(formatPhone('0141 234 5678'), '+91 141 234 5678');
  assert.equal(formatPhone('12345'), null);
});

test('phones, WhatsApp, email, Instagram and website are extracted', () => {
  const c = extractContacts('Call 98290 12345, chat wa.me/919829012345, mail Sales@Shop.in, instagram.com/shop.jaipur, www.shop.in');
  assert.deepEqual(c.whatsapp, ['+91 98290 12345']);
  assert.ok(c.phones.includes('+91 98290 12345'));
  assert.deepEqual(c.emails, ['sales@shop.in']);
  assert.deepEqual(c.instagram, ['@shop.jaipur']);
  assert.deepEqual(c.websites, ['https://shop.in']);
});

test('email providers and image names are not treated as websites or emails', () => {
  const c = extractContacts('write to owner@gmail.com, logo@2x.png');
  assert.deepEqual(c.websites, []);
  assert.deepEqual(c.emails, ['owner@gmail.com']);
});

test('Facebook link wrapper is removed', () => {
  assert.equal(unwrapFacebookLink('https://l.facebook.com/l.php?u=https%3A%2F%2Fsite.in%2Fx'), 'https://site.in/x');
});
