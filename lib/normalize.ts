import type { Ad } from './types';

/* The scraper's output has changed shape over time (camelCase vs snake_case),
 * so every field is read through a list of possible names. */

type Obj = Record<string, any>;

function pick(obj: Obj | undefined | null, ...keys: string[]): any {
  if (!obj) return undefined;
  for (const k of keys) {
    const v = k.split('.').reduce<any>((o, p) => (o == null ? undefined : o[p]), obj);
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

/** Turn the About-page object into "key: value" lines so contact patterns can read it. */
function flatten(v: any, key = '', depth = 0): string {
  if (v == null || depth > 4) return '';
  if (typeof v !== 'object') return key ? `${key}: ${v}` : String(v);
  if (Array.isArray(v)) return v.map((x) => flatten(x, key, depth + 1)).join('\n');
  return Object.entries(v).map(([k, x]) => flatten(x, k, depth + 1)).filter(Boolean).join('\n');
}

const stripHtml = (s: string) => s.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const cleanTemplate = (s: string) => s.replace(/\{\{[^}]+\}\}/g, '').trim();

export function toIsoDate(v: any): string | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number') {
    const ms = v < 1e12 ? v * 1000 : v;
    return new Date(ms).toISOString().slice(0, 10);
  }
  if (typeof v === 'string' && /^\d+$/.test(v)) return toIsoDate(Number(v));
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : new Date(t).toISOString().slice(0, 10);
}

const PLATFORM_NAMES: Record<string, string> = {
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  MESSENGER: 'Messenger',
  AUDIENCE_NETWORK: 'Audience Network',
  THREADS: 'Threads',
  WHATSAPP: 'WhatsApp',
};

export function normalizeAd(item: Obj, today = new Date()): Ad | null {
  const snap: Obj = pick(item, 'snapshot') ?? {};
  const card0: Obj = (pick(snap, 'cards') ?? [])[0] ?? {};

  const id = String(pick(item, 'ad_archive_id', 'adArchiveID', 'adArchiveId', 'adId', 'id') ?? '');
  const pageId = String(pick(item, 'page_id', 'pageID', 'pageId', 'snapshot.page_id', 'snapshot.pageId') ?? '');
  const pageName = String(pick(item, 'page_name', 'pageName', 'snapshot.page_name', 'snapshot.pageName') ?? '').trim();
  if (!id && !pageId) return null;
  if (!pageName) return null;

  let text = pick(snap, 'body.text', 'body.markup.__html', 'body') ?? pick(card0, 'body') ?? '';
  if (typeof text !== 'string') text = '';
  text = cleanTemplate(stripHtml(text));

  const title = pick(snap, 'title') ?? pick(card0, 'title') ?? null;
  const cta = pick(snap, 'cta_text', 'ctaText') ?? pick(card0, 'cta_text', 'ctaText') ?? null;
  const linkUrl = pick(snap, 'link_url', 'linkUrl') ?? pick(card0, 'link_url', 'linkUrl') ?? null;
  const img0 = (pick(snap, 'images') ?? [])[0] ?? {};
  const vid0 = (pick(snap, 'videos') ?? [])[0] ?? {};
  const imageUrl =
    pick(img0, 'resized_image_url', 'resizedImageUrl', 'original_image_url', 'originalImageUrl') ??
    pick(vid0, 'video_preview_image_url', 'videoPreviewImageUrl') ??
    pick(card0, 'resized_image_url', 'resizedImageUrl', 'original_image_url', 'originalImageUrl', 'video_preview_image_url') ??
    null;

  const rawPlatforms: string[] = pick(item, 'publisher_platform', 'publisherPlatform', 'publisherPlatforms') ?? [];
  const platforms = Array.from(
    new Set((Array.isArray(rawPlatforms) ? rawPlatforms : [rawPlatforms]).map((p) => PLATFORM_NAMES[String(p).toUpperCase()] ?? String(p)))
  );

  const startDate = toIsoDate(pick(item, 'start_date', 'startDate', 'startDateFormatted', 'ad_delivery_start_time'));
  const endDate = toIsoDate(pick(item, 'end_date', 'endDate', 'endDateFormatted', 'ad_delivery_stop_time'));
  const activeFlag = pick(item, 'is_active', 'isActive');
  const isActive = typeof activeFlag === 'boolean' ? activeFlag : !endDate || Date.parse(endDate) >= today.getTime() - 864e5;

  const until = isActive || !endDate ? today.getTime() : Date.parse(endDate);
  const daysRunning = startDate ? Math.max(1, Math.round((until - Date.parse(startDate)) / 864e5)) : 0;

  const pageUrl = pick(snap, 'page_profile_uri', 'pageProfileUri') ?? (pageId ? `https://www.facebook.com/${pageId}` : null);
  const avatarUrl = pick(snap, 'page_profile_picture_url', 'pageProfilePictureUrl') ?? null;
  const pageCategories: string[] = pick(snap, 'page_categories', 'pageCategories') ?? pick(item, 'categories') ?? [];

  // "Include About page" makes the scraper attach the advertiser's page info (address, phone, email…).
  const about = pick(item, 'about_page', 'aboutPage', 'page_info', 'pageInfo', 'advertiser', 'advertiserInfo');
  const aboutText = about ? flatten(about) : '';

  return {
    id: id || `${pageId}-${startDate}`,
    pageId: pageId || pageName,
    pageName,
    pageUrl,
    avatarUrl,
    text,
    title: title ? cleanTemplate(String(title)) || null : null,
    cta: cta ? String(cta) : null,
    linkUrl: linkUrl ? String(linkUrl) : null,
    imageUrl: imageUrl ? String(imageUrl) : null,
    platforms,
    startDate,
    endDate,
    isActive,
    daysRunning,
    variations: Number(pick(item, 'collation_count', 'collationCount') ?? 1) || 1,
    libraryUrl: id ? `https://www.facebook.com/ads/library/?id=${id}` : 'https://www.facebook.com/ads/library/',
    pageCategories: Array.isArray(pageCategories) ? pageCategories.map(String) : [],
    aboutText,
  };
}
