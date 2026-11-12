'use client';

import * as React from 'react';
import { Button, MessageBar, MessageBarBody, Badge } from '@fluentui/react-components';
import { ArrowClockwise20Regular } from '@fluentui/react-icons';
import type { Company } from '@/lib/types';
import { cityById } from '@/lib/cities';
import { cityStore } from '@/lib/stores';
import { useScan } from '@/components/useScan';
import { ScanPanel } from '@/components/ScanPanel';
import { Kpis, TopThree, Insights, CompanyTable } from '@/components/Results';
import { CompanyDrawer } from '@/components/CompanyDrawer';
import { CityMap } from '@/components/CityMap';
import { useCity } from '@/components/CityPicker';

export default function Dashboard() {
  const scan = useScan();
  const city = useCity();
  const [open, setOpen] = React.useState<Company | null>(null);
  const [area, setArea] = React.useState<string | null>(null);
  // Results belong to one city; switching city shows that city's view until it is searched.
  const r = scan.result && (scan.result.city ?? 'jaipur') === city.id ? scan.result : null;
  const otherCity = scan.result && !r ? cityById(scan.result.city) : null;

  // "See it with sample data" on the landing page links here with ?demo=1 (and optionally &city=delhi).
  const autoDemo = React.useRef(false);
  React.useEffect(() => {
    if (autoDemo.current) return;
    autoDemo.current = true;
    const q = new URLSearchParams(window.location.search);
    if (q.get('demo') === '1') {
      const id = cityById(q.get('city') ?? cityStore.get()).id;
      cityStore.set(id);
      window.history.replaceState(null, '', '/dashboard');
      scan.runDemo(id);
    }
  }, [scan]);

  const plotted = scan.running && scan.step < 3 ? [] : (r?.companies ?? []);

  const pickArea = (a: string | null) => {
    setArea(a);
    if (a) document.getElementById('all-companies')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-left">
          <h1 id="hero-title">See which {city.name} businesses are winning with ads.</h1>
          <p className="hero-lead">
            Search Facebook and Instagram ads, keep only businesses in {city.name}, rank them by how well their ads perform,
            and get their phone numbers, emails and websites.
          </p>
          <div className="mode-line">
            {scan.liveReady === null ? null : scan.liveReady ? (
              <Badge appearance="tint" color="success" shape="rounded">Live search connected</Badge>
            ) : (
              <Badge appearance="tint" color="warning" shape="rounded">Demo mode: live search not connected</Badge>
            )}
          </div>
          <ScanPanel
            liveReady={scan.liveReady}
            locked={scan.locked}
            running={scan.running}
            step={scan.step}
            detail={scan.detail}
            error={scan.error}
            onLive={(cats, limit, password) => {
              setArea(null);
              scan.runLive(cats, limit, city.id, password);
            }}
            onDemo={() => {
              setArea(null);
              scan.runDemo(city.id);
            }}
            onCancel={scan.cancel}
            onDismissError={() => scan.setError(null)}
          />
        </div>
        <CityMap
          city={city}
          companies={plotted}
          scanning={scan.running && scan.step < 3}
          revealKey={r?.scannedAt ?? 'none'}
          activeArea={area}
          onOpen={setOpen}
          onPickArea={pickArea}
        />
      </section>

      {otherCity && !scan.running && (
        <MessageBar intent="info" layout="multiline" className="demo-note">
          <MessageBarBody>
            Your latest results are for <b>{otherCity.name}</b>. Run a search to see {city.name}, or{' '}
            <a href="#" onClick={(e) => (e.preventDefault(), cityStore.set(otherCity.id))}>switch back to {otherCity.name}</a>.
          </MessageBarBody>
        </MessageBar>
      )}

      {r && (
        <>
          {r.mode === 'demo' && (
            <MessageBar layout="multiline" intent="warning" className="demo-note">
              <MessageBarBody>
                You are looking at <b>sample data</b>. The businesses and contact details are fictional, but they go through
                the same location check and scoring as real ads.
              </MessageBarBody>
            </MessageBar>
          )}
          <Kpis result={r} />
          <TopThree companies={r.companies} onOpen={setOpen} />
          <Insights companies={r.companies} onPickArea={pickArea} />
          <CompanyTable result={r} onOpen={setOpen} area={area} onClearArea={() => setArea(null)} />
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button
              appearance="subtle"
              icon={<ArrowClockwise20Regular />}
              onClick={() => {
                setArea(null);
                scan.clear();
              }}
              disabled={scan.running}
            >
              Clear results
            </Button>
          </div>
        </>
      )}

      <CompanyDrawer company={open} onClose={() => setOpen(null)} isDemo={r?.mode === 'demo'} />
    </>
  );
}
