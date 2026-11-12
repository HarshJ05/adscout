'use client';

import * as React from 'react';
import type { Company, ScanResult } from '@/lib/types';
import { demoResult } from '@/lib/demo';
import { mergeContacts } from '@/lib/contacts';
import { googleAdsUrlFor } from '@/lib/aggregate';
import { useLocalStore } from '@/lib/store';
import { resultStore, historyStore } from '@/lib/stores';
import { addSnapshot, toSnapshot } from '@/lib/history';
import { cityById } from '@/lib/cities';

export type StepState = 'waiting' | 'active' | 'done';
export const STEP_LABELS = [
  'Searching the Meta Ads Library',
  'Checking which businesses are local',
  'Ranking companies by ad performance',
  'Finding contact details',
] as const;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The live-search password is kept for this browser tab only. */
const PASS_KEY = 'adscout:live-pass';
export const savedLivePassword = () => {
  try {
    return sessionStorage.getItem(PASS_KEY) ?? '';
  } catch {
    return '';
  }
};
export const saveLivePassword = (p: string) => {
  try {
    sessionStorage.setItem(PASS_KEY, p);
  } catch {
    /* private mode: ask again next time */
  }
};
const clearLivePassword = () => {
  try {
    sessionStorage.removeItem(PASS_KEY);
  } catch {
    /* ignore */
  }
};

export function useScan() {
  const [liveReady, setLiveReady] = React.useState<boolean | null>(null);
  const [locked, setLocked] = React.useState(false);
  const passRef = React.useRef('');
  const result = useLocalStore(resultStore);
  const setResult = (r: ScanResult | null) => resultStore.set(r);
  const [running, setRunning] = React.useState(false);
  const [step, setStep] = React.useState(-1); // index of the active step, 4 = finished
  const [detail, setDetail] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const cancelRef = React.useRef(false);

  React.useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((j) => {
        setLiveReady(Boolean(j.live));
        setLocked(Boolean(j.locked));
      })
      .catch(() => setLiveReady(false));
  }, []);

  const finish = React.useCallback((r: ScanResult) => {
    resultStore.set(r);
    historyStore.set((h) => addSnapshot(h, toSnapshot(r)));
    setStep(4);
    setRunning(false);
    setDetail('');
  }, []);

  const runDemo = React.useCallback(async (cityId: string) => {
    const city = cityById(cityId);
    cancelRef.current = false;
    setError(null);
    setRunning(true);
    const r = demoResult(new Date(), city);
    const labels = [
      `Reading ${r.adsChecked} sample ads…`,
      `${r.companies.length} ${city.name} businesses confirmed, ${r.rejected} from elsewhere removed`,
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
  }, [finish]);

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
          headers: { 'Content-Type': 'application/json', 'x-live-password': passRef.current },
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

  const runLive = React.useCallback(async (categories: string[], limit: number, cityId: string, password = '') => {
    passRef.current = password;
    const auth = { 'x-live-password': password };
    const city = cityById(cityId);
    cancelRef.current = false;
    setError(null);
    setRunning(true);
    setStep(0);
    setDetail('Starting the scraper…');
    try {
      const start = await fetch('/api/scan/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify({ categories, limit, city: city.id }),
      }).then((r) => r.json());
      if (start.error === 'PASSWORD') {
        clearLivePassword();
        throw new Error('That password is not correct. Sample data works without one.');
      }
      if (start.error) throw new Error(start.message || start.error);

      const began = Date.now();
      let status = 'RUNNING';
      while (!['SUCCEEDED', 'FAILED', 'TIMED-OUT', 'ABORTED'].includes(status)) {
        await sleep(5000);
        if (cancelRef.current) return;
        const s = await fetch(`/api/scan/status?runId=${encodeURIComponent(start.runId)}`, { headers: auth }).then((r) => r.json());
        if (s.error) throw new Error(s.message || s.error);
        status = s.status;
        const secs = Math.round((Date.now() - began) / 1000);
        setDetail(`${s.adsFound ?? 0} ads collected so far · ${secs}s (this usually takes 1–4 minutes)`);
        if (Date.now() - began > 15 * 60 * 1000) throw new Error('The search took longer than 15 minutes. Try fewer business types.');
      }
      // A stopped run may still have collected ads — use them.
      setStep(1);
      setDetail(`Reading the ads and checking for ${city.name} addresses, PIN codes and phone codes…`);
      const r: ScanResult & { error?: string; message?: string } = await fetch(
        `/api/scan/results?datasetId=${encodeURIComponent(start.datasetId)}&city=${city.id}`,
        { headers: auth }
      ).then((x) => x.json());
      if (r.error) throw new Error(r.message || r.error);
      if (status !== 'SUCCEEDED' && r.adsChecked === 0) throw new Error(`The scraper stopped (${status}) before finding any ads.`);

      setStep(2);
      setDetail(`${r.companies.length} ${city.name} businesses found. Ranking them…`);
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
  }, [finish]);

  const cancel = () => {
    cancelRef.current = true;
    setRunning(false);
    setStep(-1);
    setDetail('');
  };

  const clear = () => {
    setResult(null);
    setStep(-1);
  };

  return { liveReady, locked, result, running, step, detail, error, setError, runDemo, runLive, cancel, clear };
}
