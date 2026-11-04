'use client';

import * as React from 'react';
import type { Company, ScanResult } from '@/lib/types';
import { demoResult } from '@/lib/demo';
import { mergeContacts } from '@/lib/contacts';
import { googleAdsUrlFor } from '@/lib/aggregate';

export type StepState = 'waiting' | 'active' | 'done';
export const STEP_LABELS = [
  'Searching the Meta Ads Library',
  'Checking which businesses are in Jaipur',
  'Ranking companies by ad performance',
  'Finding contact details',
] as const;

const STORE_KEY = 'jaf:last-result:v1';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function load(): ScanResult | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as ScanResult) : null;
  } catch {
    return null;
  }
}
function save(r: ScanResult) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(r));
  } catch {
    /* storage full or blocked — results still show on screen */
  }
}

export function useScan() {
  const [liveReady, setLiveReady] = React.useState<boolean | null>(null);
  const [result, setResult] = React.useState<ScanResult | null>(null);
  const [running, setRunning] = React.useState(false);
  const [step, setStep] = React.useState(-1); // index of the active step, 4 = finished
  const [detail, setDetail] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const cancelRef = React.useRef(false);

  React.useEffect(() => {
    setResult(load());
    fetch('/api/config')
      .then((r) => r.json())
      .then((j) => setLiveReady(Boolean(j.live)))
      .catch(() => setLiveReady(false));
  }, []);

  const finish = (r: ScanResult) => {
    setResult(r);
    save(r);
    setStep(4);
    setRunning(false);
    setDetail('');
  };

  const runDemo = React.useCallback(async () => {
    cancelRef.current = false;
    setError(null);
    setRunning(true);
    const r = demoResult();
    const labels = [
      `Reading ${r.adsChecked} sample ads…`,
      `${r.companies.length} Jaipur businesses confirmed, ${r.rejected} outside Jaipur removed`,
      'Scoring active ads, ad age, platforms and new ads…',
      'Collecting phone numbers, emails and websites…',
    ];
    for (let i = 0; i < 4; i++) {
      setStep(i);
      setDetail(labels[i]);
      await sleep(900);
      if (cancelRef.current) return;
    }
    finish(r);
  }, []);

  const enrich = async (companies: Company[], onUpdate: (c: Company[]) => void) => {
    const targets = companies
      .filter((c) => c.contacts.websites[0] && (c.contacts.phones.length === 0 || c.contacts.emails.length === 0))
      .slice(0, 40);
    let list = companies;
    for (let i = 0; i < targets.length; i += 6) {
      if (cancelRef.current) return list;
      const batch = targets.slice(i, i + 6);
      setDetail(`Visiting company websites (${Math.min(i + 6, targets.length)} of ${targets.length})…`);
      try {
        const res = await fetch('/api/enrich', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: batch.map((c) => ({ id: c.id, website: c.contacts.websites[0] })) }),
        });
        const json = await res.json();
        const found = new Map<string, any>((json.results ?? []).map((x: any) => [x.id, x.contacts]));
        list = list.map((c) => {
          const extra = found.get(c.id);
          if (!extra) return c;
          const contacts = mergeContacts(c.contacts, extra);
          return { ...c, contacts, enriched: true, googleAdsUrl: googleAdsUrlFor(contacts.websites[0] ?? null, c.name) };
        });
        onUpdate(list);
      } catch {
        /* one failed batch should not stop the scan */
      }
    }
    return list;
  };

  const runLive = React.useCallback(async (categories: string[], limit: number) => {
    cancelRef.current = false;
    setError(null);
    setRunning(true);
    setStep(0);
    setDetail('Starting the scraper…');
    try {
      const start = await fetch('/api/scan/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories, limit }),
      }).then((r) => r.json());
      if (start.error) throw new Error(start.message || start.error);

      const began = Date.now();
      let status = 'RUNNING';
      while (!['SUCCEEDED', 'FAILED', 'TIMED-OUT', 'ABORTED'].includes(status)) {
        await sleep(5000);
        if (cancelRef.current) return;
        const s = await fetch(`/api/scan/status?runId=${encodeURIComponent(start.runId)}`).then((r) => r.json());
        if (s.error) throw new Error(s.message || s.error);
        status = s.status;
        const secs = Math.round((Date.now() - began) / 1000);
        setDetail(`${s.adsFound ?? 0} ads collected so far · ${secs}s (this usually takes 1–4 minutes)`);
        if (Date.now() - began > 15 * 60 * 1000) throw new Error('The search took longer than 15 minutes. Try fewer business types.');
      }
      // A stopped run may still have collected ads — use them.
      setStep(1);
      setDetail('Reading the ads and checking for Jaipur addresses, PIN codes and phone codes…');
      const r: ScanResult & { error?: string; message?: string } = await fetch(
        `/api/scan/results?datasetId=${encodeURIComponent(start.datasetId)}`
      ).then((x) => x.json());
      if (r.error) throw new Error(r.message || r.error);
      if (status !== 'SUCCEEDED' && r.adsChecked === 0) throw new Error(`The scraper stopped (${status}) before finding any ads.`);

      setStep(2);
      setDetail(`${r.companies.length} Jaipur businesses found. Ranking them…`);
      await sleep(600);

      setStep(3);
      setResult(r);
      const companies = await enrich(r.companies, (c) => setResult({ ...r, companies: c }));
      if (cancelRef.current) return;
      finish({ ...r, companies: companies ?? r.companies });
    } catch (e: any) {
      setError(e?.message || 'Something went wrong.');
      setRunning(false);
      setStep(-1);
    }
  }, []);

  const cancel = () => {
    cancelRef.current = true;
    setRunning(false);
    setStep(-1);
    setDetail('');
  };

  const clear = () => {
    try {
      localStorage.removeItem(STORE_KEY);
    } catch {
      /* ignore */
    }
    setResult(null);
    setStep(-1);
  };

  return { liveReady, result, running, step, detail, error, setError, runDemo, runLive, cancel, clear };
}
