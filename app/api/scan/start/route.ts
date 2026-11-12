import { NextResponse } from 'next/server';
import { apifyToken, startAdLibraryRun } from '@/lib/apify';
import { searchTermsFor } from '@/lib/categories';
import { cityById } from '@/lib/cities';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/** Step 1: start a Meta Ads Library scrape on Apify. Returns immediately with a run id. */
export async function POST(req: Request) {
  if (!apifyToken()) {
    return NextResponse.json({ error: 'NO_TOKEN', message: 'Live search is not set up yet. Add APIFY_TOKEN in Vercel settings.' }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));
  const categories: string[] = Array.isArray(body.categories) ? body.categories.map(String) : [];
  const total = Math.min(Math.max(Number(body.limit) || 300, 50), 2000);
  const city = cityById(typeof body.city === 'string' ? body.city : null);
  const queries = searchTermsFor(categories, city.name);
  const perQuery = Math.max(20, Math.ceil(total / queries.length));
  try {
    const run = await startAdLibraryRun(queries, perQuery);
    return NextResponse.json({ ...run, queries, city: city.id });
  } catch (e: any) {
    return NextResponse.json({ error: 'START_FAILED', message: e.message }, { status: 502 });
  }
}
