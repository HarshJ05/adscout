import { NextResponse } from 'next/server';
import { denyWithoutLivePassword } from '@/lib/liveAuth';
import { extractContacts, emptyContacts } from '@/lib/contacts';
import type { Contacts } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BLOCKED_HOST = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[?::1\]?$)|\.local$|\.internal$/i;

async function fetchText(url: string, ms = 8000): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AdScout/1.0)', Accept: 'text/html' },
      cache: 'no-store',
    });
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('text/html')) return '';
    return (await res.text()).slice(0, 600_000);
  } catch {
    return '';
  } finally {
    clearTimeout(t);
  }
}

/** Visit a company's website (home + contact page) and collect phones, emails, WhatsApp, Instagram. */
async function contactsFromSite(site: string): Promise<Contacts> {
  let u: URL;
  try {
    u = new URL(site);
  } catch {
    return emptyContacts();
  }
  if (!/^https?:$/.test(u.protocol) || BLOCKED_HOST.test(u.hostname)) return emptyContacts();

  const out = emptyContacts();
  const home = await fetchText(u.origin);
  if (home) extractContacts(decodeLinks(home), out);
  if (out.phones.length === 0 || out.emails.length === 0) {
    for (const path of ['/contact', '/contact-us']) {
      const html = await fetchText(u.origin + path, 6000);
      if (html) {
        extractContacts(decodeLinks(html), out);
        break;
      }
    }
  }
  out.websites = []; // the site itself is already known
  return out;
}

/** Turn tel:/mailto: links into plain text the extractor can read. */
const decodeLinks = (html: string) =>
  html
    .replace(/href=["']tel:([^"']+)["']/gi, ' $1 ')
    .replace(/href=["']mailto:([^"'?]+)[^"']*["']/gi, ' $1 ')
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');

export async function POST(req: Request) {
  const denied = denyWithoutLivePassword(req);
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const items: { id: string; website: string }[] = Array.isArray(body.items) ? body.items.slice(0, 6) : [];
  const results = await Promise.all(
    items.map(async (it) => ({ id: String(it.id), contacts: await contactsFromSite(String(it.website)) }))
  );
  return NextResponse.json({ results });
}
