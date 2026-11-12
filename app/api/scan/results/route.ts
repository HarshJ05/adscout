import { NextResponse } from 'next/server';
import { denyWithoutLivePassword } from '@/lib/liveAuth';
import { getDatasetItems } from '@/lib/apify';
import { normalizeAd } from '@/lib/normalize';
import { buildCompanies } from '@/lib/aggregate';
import type { Ad } from '@/lib/types';
import { cityById } from '@/lib/cities';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Step 3: read the scraped ads, keep advertisers in the chosen city, rank them. */
export async function GET(req: Request) {
  const denied = denyWithoutLivePassword(req);
  if (denied) return denied;
  const params = new URL(req.url).searchParams;
  const datasetId = params.get('datasetId');
  const city = cityById(params.get('city'));
  if (!datasetId) return NextResponse.json({ error: 'datasetId is required' }, { status: 400 });
  try {
    const items = await getDatasetItems(datasetId);
    const today = new Date();
    const ads = items.map((i) => normalizeAd(i, today)).filter(Boolean) as Ad[];
    return NextResponse.json(buildCompanies(ads, 'live', today, city));
  } catch (e: any) {
    return NextResponse.json({ error: 'RESULTS_FAILED', message: e.message }, { status: 502 });
  }
}
