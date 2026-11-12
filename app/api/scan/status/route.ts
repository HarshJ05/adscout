import { NextResponse } from 'next/server';
import { denyWithoutLivePassword } from '@/lib/liveAuth';
import { getRun, getDatasetItemCount } from '@/lib/apify';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/** Step 2: the page asks every few seconds how the scrape is going. */
export async function GET(req: Request) {
  const denied = denyWithoutLivePassword(req);
  if (denied) return denied;
  const runId = new URL(req.url).searchParams.get('runId');
  if (!runId) return NextResponse.json({ error: 'runId is required' }, { status: 400 });
  try {
    const run = await getRun(runId);
    const adsFound = await getDatasetItemCount(run.datasetId).catch(() => 0);
    return NextResponse.json({ ...run, adsFound });
  } catch (e: any) {
    return NextResponse.json({ error: 'STATUS_FAILED', message: e.message }, { status: 502 });
  }
}
