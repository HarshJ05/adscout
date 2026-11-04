import type { Ad, Company, ScanResult } from './types';
import { checkJaipur } from './jaipur';
import { extractContacts, emptyContacts, websiteOf, unwrapFacebookLink } from './contacts';
import { scoreCompany } from './scoring';
import { classify } from './categories';
import { areaFromSignals } from './areas';

export const metaLibraryUrlFor = (pageId: string) =>
  /^\d+$/.test(pageId)
    ? `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=IN&view_all_page_id=${pageId}`
    : `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=IN&q=${encodeURIComponent(pageId)}`;

export const googleAdsUrlFor = (website: string | null, name: string) => {
  if (website) {
    try {
      return `https://adstransparency.google.com/?region=IN&domain=${new URL(website).hostname.replace(/^www\./, '')}`;
    } catch {
      /* fall through */
    }
  }
  return `https://adstransparency.google.com/?region=IN&query=${encodeURIComponent(name)}`;
};

/** Group ads by advertiser, check Jaipur, extract contacts and score each company. */
export function buildCompanies(ads: Ad[], mode: ScanResult['mode'], today = new Date()): ScanResult {
  const byPage = new Map<string, Ad[]>();
  const seen = new Set<string>();
  for (const ad of ads) {
    if (seen.has(ad.id)) continue; // the same ad can come back from two searches
    seen.add(ad.id);
    const list = byPage.get(ad.pageId) ?? [];
    list.push(ad);
    byPage.set(ad.pageId, list);
  }

  const companies: Company[] = [];
  let rejected = 0;

  for (const [pageId, list] of byPage) {
    const first = list[0];
    const allText = [
      first.pageName,
      ...list.map((a) => [a.text, a.title ?? '', a.linkUrl ?? '', a.aboutText].join('\n')),
    ].join('\n');

    const jaipur = checkJaipur(allText);
    if (jaipur.points === 0) {
      rejected++;
      continue;
    }

    const contacts = extractContacts(allText, emptyContacts());
    for (const a of list) {
      if (a.linkUrl) {
        const site = websiteOf(unwrapFacebookLink(a.linkUrl));
        if (site && !contacts.websites.includes(site)) contacts.websites.unshift(site);
      }
    }

    const s = scoreCompany(list, today);
    const sorted = [...list].sort((a, b) => Number(b.isActive) - Number(a.isActive) || b.daysRunning - a.daysRunning);
    const starts = list.map((a) => a.startDate).filter(Boolean).sort() as string[];

    companies.push({
      id: pageId,
      name: first.pageName,
      pageUrl: first.pageUrl,
      avatarUrl: first.avatarUrl,
      category: classify(allText, first.pageCategories),
      area: areaFromSignals(jaipur.signals),
      jaipur,
      ads: sorted,
      activeAds: s.activeAds,
      totalAds: list.length,
      longestRunningDays: s.longestRunningDays,
      newAds30d: s.newAds30d,
      platforms: s.platforms,
      firstSeen: starts[0] ?? null,
      score: s.score,
      scoreParts: s.parts,
      tier: s.tier,
      contacts,
      metaLibraryUrl: metaLibraryUrlFor(pageId),
      googleAdsUrl: googleAdsUrlFor(contacts.websites[0] ?? null, first.pageName),
      enriched: false,
    });
  }

  companies.sort((a, b) => b.score - a.score || b.activeAds - a.activeAds);
  return { mode, scannedAt: today.toISOString(), adsChecked: seen.size, companies, rejected };
}
