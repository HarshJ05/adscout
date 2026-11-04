import { NextResponse, type NextRequest } from 'next/server';

/**
 * Optional password lock for the whole site (pages + API).
 * Set SITE_PASSWORD in Vercel to turn it on; leave it empty to keep the site open.
 * This stops strangers who find the link from using up your Apify credits.
 */
export function proxy(req: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next();

  const header = req.headers.get('authorization') ?? '';
  if (header.startsWith('Basic ')) {
    try {
      const [, given = ''] = atob(header.slice(6)).split(/:(.*)/s);
      if (safeEqual(given, password)) return NextResponse.next();
    } catch {
      /* malformed header — fall through to the login prompt */
    }
  }
  return new NextResponse('Password required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Jaipur Ad Finder", charset="UTF-8"' },
  });
}

/** Compare without exiting early, so response time doesn't reveal how much of the password matched. */
function safeEqual(a: string, b: string) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export const config = {
  // Everything except Next.js build files and the icons.
  matcher: ['/((?!_next/static|_next/image|icon.svg|favicon.ico|opengraph-image).*)'],
};
