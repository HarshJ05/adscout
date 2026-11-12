import type { Company } from './types';
import { cityById } from './cities';

export type LeadStatus = 'new' | 'contacted' | 'interested' | 'won' | 'not-interested';

export const LEAD_STATUSES: { id: LeadStatus; label: string }[] = [
  { id: 'new', label: 'To contact' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'interested', label: 'Interested' },
  { id: 'won', label: 'Won' },
  { id: 'not-interested', label: 'Not interested' },
];

export const statusLabel = (s: LeadStatus) => LEAD_STATUSES.find((x) => x.id === s)?.label ?? s;

/** A saved lead keeps its own copy of the company details, so it survives the next search. */
export interface Lead {
  id: string;
  name: string;
  category: string;
  area: string | null;
  score: number;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  status: LeadStatus;
  note: string;
  addedAt: string;
  updatedAt: string;
  sample: boolean;
  /** City id the lead was found in */
  city?: string;
}

export type LeadMap = Record<string, Lead>;

export function leadFromCompany(c: Company, sample: boolean, now = new Date(), city?: string): Lead {
  const t = now.toISOString();
  return {
    id: c.id,
    name: c.name,
    category: c.category,
    area: c.area,
    score: c.score,
    phone: c.contacts.phones[0] ?? null,
    whatsapp: c.contacts.whatsapp[0] ?? null,
    email: c.contacts.emails[0] ?? null,
    website: c.contacts.websites[0] ?? null,
    status: 'new',
    note: '',
    addedAt: t,
    updatedAt: t,
    sample,
    city,
  };
}

export function setStatus(leads: LeadMap, id: string, status: LeadStatus, now = new Date()): LeadMap {
  const l = leads[id];
  if (!l) return leads;
  return { ...leads, [id]: { ...l, status, updatedAt: now.toISOString() } };
}

export function countByStatus(leads: LeadMap): Record<LeadStatus, number> {
  const out: Record<LeadStatus, number> = { new: 0, contacted: 0, interested: 0, won: 0, 'not-interested': 0 };
  for (const l of Object.values(leads)) out[l.status]++;
  return out;
}

export const DEFAULT_TEMPLATE =
  'Hi {name}, I came across your {category} ads on Facebook and Instagram. We help businesses in {city} get more enquiries from the same ad budget. Could I share a few ideas for {name}? It takes 10 minutes.';

/** Fill {name}, {category}, {area} and {city} in a message template. */
export function fillTemplate(template: string, lead: Pick<Lead, 'name' | 'category' | 'area'>, cityName = 'your city'): string {
  return template
    .replaceAll('{name}', lead.name)
    .replaceAll('{category}', lead.category.toLowerCase())
    .replaceAll('{area}', lead.area ?? cityName)
    .replaceAll('{city}', cityName);
}

export function leadsToCsv(leads: Lead[]): string {
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = ['Company', 'City', 'Status', 'Business type', 'Area', 'Score', 'Phone', 'WhatsApp', 'Email', 'Website', 'Note', 'Added', 'Updated'];
  const rows = leads.map((l) => [l.name, l.city ? cityById(l.city).name : '', statusLabel(l.status), l.category, l.area ?? '', l.score, l.phone ?? '', l.whatsapp ?? '', l.email ?? '', l.website ?? '', l.note, l.addedAt.slice(0, 10), l.updatedAt.slice(0, 10)]);
  return '﻿' + [head, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
}
