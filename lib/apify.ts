/**
 * Small wrapper around the Apify REST API.
 * The scraper runs on Apify's servers (it needs a real browser and can take
 * several minutes), so Vercel only starts the run, checks on it, and reads
 * the results. That keeps every Vercel function well under its time limit.
 */
const API = 'https://api.apify.com/v2';

export const apifyToken = () => process.env.APIFY_TOKEN?.trim() || '';
export const actorId = () => (process.env.APIFY_ACTOR_ID?.trim() || 'apify~facebook-ads-scraper').replace('/', '~');

/** Meta Ads Library search page for India, active ads, any ad type. */
export function adLibrarySearchUrl(query: string) {
  const p = new URLSearchParams({
    active_status: 'active',
    ad_type: 'all',
    country: 'IN',
    q: query,
    search_type: 'keyword_unordered',
    media_type: 'all',
  });
  return `https://www.facebook.com/ads/library/?${p.toString()}`;
}

async function call(path: string, init?: RequestInit) {
  const token = apifyToken();
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${API}${path}${sep}token=${encodeURIComponent(token)}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Apify ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

export async function startAdLibraryRun(queries: string[], limitPerQuery: number) {
  const input = {
    startUrls: queries.map((q) => ({ url: adLibrarySearchUrl(q) })),
    resultsLimit: limitPerQuery,
    activeStatus: 'active',
    includeAboutPage: true, // advertiser page info: address, phone, email
  };
  const json = await call(`/acts/${actorId()}/runs`, { method: 'POST', body: JSON.stringify(input) });
  return { runId: json.data.id as string, datasetId: json.data.defaultDatasetId as string };
}

export async function getRun(runId: string) {
  const json = await call(`/actor-runs/${encodeURIComponent(runId)}`);
  const d = json.data;
  return {
    status: d.status as string, // READY | RUNNING | SUCCEEDED | FAILED | TIMED-OUT | ABORTED
    datasetId: d.defaultDatasetId as string,
    startedAt: d.startedAt as string,
  };
}

export async function getDatasetItemCount(datasetId: string) {
  const json = await call(`/datasets/${encodeURIComponent(datasetId)}`);
  return (json.data?.itemCount as number) ?? 0;
}

export async function getDatasetItems(datasetId: string, limit = 2000) {
  return (await call(`/datasets/${encodeURIComponent(datasetId)}/items?clean=true&format=json&limit=${limit}`)) as any[];
}
