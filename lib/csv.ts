import type { Company } from './types';

const esc = (v: unknown) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function companiesToCsv(companies: Company[]): string {
  const head = [
    'Rank', 'Company', 'Business type', 'Performance score', 'Level', 'Active ads', 'Longest running ad (days)',
    'New ads (30 days)', 'Platforms', 'Location match', 'Phones', 'WhatsApp', 'Emails', 'Websites', 'Instagram',
    'Address', 'Facebook page', 'Meta Ads Library', 'Google Ads Transparency',
  ];
  const rows = companies.map((c, i) => [
    i + 1, c.name, c.category, c.score, c.tier, c.activeAds, c.longestRunningDays, c.newAds30d, c.platforms.join(' / '),
    c.geo.level, c.contacts.phones.join(' / '), c.contacts.whatsapp.join(' / '), c.contacts.emails.join(' / '),
    c.contacts.websites.join(' / '), c.contacts.instagram.join(' / '), c.contacts.address ?? '', c.pageUrl ?? '',
    c.metaLibraryUrl, c.googleAdsUrl,
  ]);
  // BOM so Excel opens Hindi / special characters correctly.
  return '﻿' + [head, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
}
