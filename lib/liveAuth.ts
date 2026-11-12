import { NextResponse } from 'next/server';

/**
 * Live searches spend the owner's Apify credit, so they can be locked behind a password.
 * Set LIVE_SEARCH_PASSWORD (in Vercel → Settings → Environment Variables) to turn it on.
 * Sample data never needs it. Without the variable (e.g. on your own laptop) live search is open.
 */
export const livePasswordRequired = () => Boolean(process.env.LIVE_SEARCH_PASSWORD?.trim());

function safeEqual(a: string, b: string) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

/** Returns a 401 response when the password is required and missing or wrong, otherwise null. */
export function denyWithoutLivePassword(req: Request): NextResponse | null {
  const expected = process.env.LIVE_SEARCH_PASSWORD?.trim();
  if (!expected) return null;
  const given = req.headers.get('x-live-password') ?? '';
  if (safeEqual(given, expected)) return null;
  return NextResponse.json({ error: 'PASSWORD', message: 'Live search needs the correct password. Sample data works without one.' }, { status: 401 });
}
