import type { Contacts } from './types';

export const emptyContacts = (): Contacts => ({
  phones: [],
  emails: [],
  whatsapp: [],
  websites: [],
  instagram: [],
  address: null,
});

const SOCIAL_OR_SHORT = /(facebook\.com|fb\.com|fb\.me|instagram\.com|wa\.me|whatsapp\.com|m\.me|messenger\.com|l\.facebook\.com|bit\.ly|linktr\.ee)/i;

/** STD codes of the supported cities, longest first, so 141 is tried before 11-style codes. */
const STD_CODES = ['141', '11', '20', '22', '40', '79', '80'];

/** Format an Indian number as +91 XXXXX XXXXX (mobile) or +91 <STD> <number> (landline of a supported city). */
export function formatPhone(raw: string): string | null {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('0091')) d = d.slice(4);
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  if (d.length !== 10) return null;
  if (/^[6-9]/.test(d)) return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
  const std = STD_CODES.find((c) => d.startsWith(c));
  if (!std) return null;
  const rest = d.slice(std.length);
  return `+91 ${std} ${rest.slice(0, rest.length - 4)} ${rest.slice(-4)}`;
}

// Mobiles (with or without +91/0), and landlines written with a leading 0 or +91 (10 digits including the STD code).
const PHONE_RE = /(?:(?:\+91[\s-]?|\b0)?[6-9]\d{4}[\s-]?\d{5}|(?:\+91[\s-]?|\b0)(?:141|11|20|22|40|79|80)(?:[\s-]?\d){6,8})\b/g;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const WA_RE = /(?:wa\.me\/|api\.whatsapp\.com\/send\/?\?phone=|whatsapp\.com\/send\/?\?phone=)\+?(\d{10,13})/gi;
const IG_RE = /instagram\.com\/([A-Za-z0-9._]{2,30})/gi;
const URL_RE = /\bhttps?:\/\/[^\s"'<>)]+/gi;
const BARE_DOMAIN_RE = /\b(?:www\.)?[a-z0-9-]{2,}\.(?:com|in|co\.in|org|net|biz|info|store|shop)(?:\/[^\s"'<>)]*)?/gi;

const BAD_EMAIL = /\.(png|jpe?g|gif|webp|svg)$|example\.|sentry|wixpress|@2x|domain\.com|email\.com$/i;
const MAIL_HOSTS = /^(?:www\.)?(gmail|yahoo|hotmail|outlook|rediffmail|icloud|live)\.(com|in|co\.in)\b/i;
const IG_RESERVED = new Set(['p', 'reel', 'reels', 'explore', 'accounts', 'stories', 'tv', 'about', 'developer', 'legal']);

export function websiteOf(url: string): string | null {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    if (SOCIAL_OR_SHORT.test(u.hostname)) return null;
    return `https://${u.hostname.toLowerCase().replace(/^www\./, '')}`;
  } catch {
    return null;
  }
}

/** Facebook wraps outbound links as l.facebook.com/l.php?u=<real url>. */
export function unwrapFacebookLink(url: string): string {
  try {
    const u = new URL(url);
    if (/l\.facebook\.com|lm\.facebook\.com/.test(u.hostname) && u.searchParams.get('u')) {
      return u.searchParams.get('u')!;
    }
  } catch {
    /* ignore */
  }
  return url;
}

/** Pull every contact detail we can find out of free text (ad copy, About page, HTML). */
export function extractContacts(text: string, into: Contacts = emptyContacts()): Contacts {
  const add = (list: string[], v: string | null) => {
    if (v && !list.includes(v)) list.push(v);
  };

  for (const m of text.matchAll(WA_RE)) add(into.whatsapp, formatPhone(m[1]));
  for (const m of text.matchAll(PHONE_RE)) add(into.phones, formatPhone(m[0]));
  for (const m of text.matchAll(EMAIL_RE)) {
    const e = m[0].toLowerCase().replace(/\.$/, '');
    if (!BAD_EMAIL.test(e)) add(into.emails, e);
  }
  for (const m of text.matchAll(IG_RE)) {
    const h = m[1].replace(/\.$/, '').toLowerCase();
    if (!IG_RESERVED.has(h)) add(into.instagram, `@${h}`);
  }
  for (const m of text.matchAll(URL_RE)) add(into.websites, websiteOf(unwrapFacebookLink(m[0])));
  for (const m of text.matchAll(BARE_DOMAIN_RE)) {
    const before = text[(m.index ?? 0) - 1];
    if (before === '@' || before === '.' || MAIL_HOSTS.test(m[0])) continue; // part of an email or a longer domain
    add(into.websites, websiteOf(m[0]));
  }
  if (!into.address) {
    const addr = text.match(/(?:address|addr|visit us|location)\s*[:\-–]\s*([^\n]{10,140})/i);
    if (addr) into.address = addr[1].trim();
  }
  // A WhatsApp number is also a phone number.
  for (const w of into.whatsapp) add(into.phones, w);
  return into;
}

export function mergeContacts(a: Contacts, b: Contacts): Contacts {
  const u = (x: string[], y: string[]) => Array.from(new Set([...x, ...y]));
  return {
    phones: u(a.phones, b.phones),
    emails: u(a.emails, b.emails),
    whatsapp: u(a.whatsapp, b.whatsapp),
    websites: u(a.websites, b.websites),
    instagram: u(a.instagram, b.instagram),
    address: a.address ?? b.address,
  };
}

export const contactCount = (c: Contacts) =>
  c.phones.length + c.emails.length + c.whatsapp.length + c.websites.length + c.instagram.length;
