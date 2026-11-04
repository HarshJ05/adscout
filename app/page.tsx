'use client';

import * as React from 'react';
import { Button, MessageBar, MessageBarBody, Badge } from '@fluentui/react-components';
import { ArrowClockwise20Regular } from '@fluentui/react-icons';
import type { Company } from '@/lib/types';
import { useScan } from '@/components/useScan';
import { ScanPanel } from '@/components/ScanPanel';
import { Kpis, TopThree, Insights, CompanyTable } from '@/components/Results';
import { CompanyDrawer } from '@/components/CompanyDrawer';
import { JaipurMap } from '@/components/JaipurMap';

export default function Dashboard() {
  const scan = useScan();
  const [open, setOpen] = React.useState<Company | null>(null);
  const [area, setArea] = React.useState<string | null>(null);
  const r = scan.result;

  // While a new search runs, old dots leave the map until fresh results arrive.
  const plotted = scan.running && scan.step < 3 ? [] : (r?.companies ?? []);

  const pickArea = (a: string | null) => {
    setArea(a);
    if (a) document.getElementById('all-companies')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-left">
          <h1 id="hero-title">See which Jaipur businesses are winning with ads.</h1>
          <p className="hero-lead">
            Search Facebook and Instagram ads, keep only businesses in Jaipur, rank them by how well their ads perform,
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
            running={scan.running}
            step={scan.step}
            detail={scan.detail}
            error={scan.error}
            onLive={scan.runLive}
            onDemo={() => {
              setArea(null);
              scan.runDemo();
            }}
            onCancel={scan.cancel}
            onDismissError={() => scan.setError(null)}
          />
        </div>
        <JaipurMap
          companies={plotted}
          scanning={scan.running && scan.step < 3}
          revealKey={r?.scannedAt ?? 'none'}
          activeArea={area}
          onOpen={setOpen}
          onPickArea={pickArea}
        />
      </section>

      {r && (
        <>
          {r.mode === 'demo' && (
            <MessageBar layout="multiline" intent="warning" className="demo-note">
              <MessageBarBody>
                You are looking at <b>sample data</b>. The businesses and contact details are fictional, but they go through
                the same Jaipur check and scoring as real ads.
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
