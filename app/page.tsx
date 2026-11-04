'use client';

import * as React from 'react';
import { Button, MessageBar, MessageBarBody, Badge } from '@fluentui/react-components';
import {
  ArrowClockwise20Regular,
  Megaphone24Regular,
  ShieldCheckmark20Regular,
  DataTrending20Regular,
  ArrowDownload20Regular,
} from '@fluentui/react-icons';
import type { Company } from '@/lib/types';
import { useScan } from '@/components/useScan';
import { ScanPanel } from '@/components/ScanPanel';
import { Kpis, TopThree, Insights, CompanyTable } from '@/components/Results';
import { CompanyDrawer } from '@/components/CompanyDrawer';

export default function Dashboard() {
  const scan = useScan();
  const [open, setOpen] = React.useState<Company | null>(null);
  const r = scan.result;

  return (
    <>
      <div className="hero">
        <div className="hero-text">
          <span className="eyebrow">Meta Ads Library · Jaipur</span>
          <h1>Find Jaipur businesses that advertise — and see who does it best.</h1>
          <p>
            This tool searches Facebook and Instagram ads, keeps only businesses in Jaipur, ranks them by how well
            their ads are performing, and collects their phone numbers, emails and websites.
          </p>
          <ol className="hero-steps" aria-label="How it works">
            <li><span className="step-dot">1</span>Search ads</li>
            <li><span className="step-dot">2</span>Keep Jaipur only</li>
            <li><span className="step-dot">3</span>Rank the best</li>
            <li><span className="step-dot">4</span>Get contacts</li>
          </ol>
          <div className="trust-row">
            <span><ShieldCheckmark20Regular /> Public Meta Ads Library data</span>
            <span><DataTrending20Regular /> Transparent 0–100 score</span>
            <span><ArrowDownload20Regular /> Export to Excel</span>
          </div>
          <div style={{ marginTop: 20 }}>
            {scan.liveReady === null ? null : scan.liveReady ? (
              <Badge appearance="tint" color="success" size="large">● Live search connected</Badge>
            ) : (
              <Badge appearance="tint" color="warning" size="large">Demo mode: live search not connected</Badge>
            )}
          </div>
        </div>
        <ScanPanel
          liveReady={scan.liveReady}
          running={scan.running}
          step={scan.step}
          detail={scan.detail}
          error={scan.error}
          onLive={scan.runLive}
          onDemo={scan.runDemo}
          onCancel={scan.cancel}
          onDismissError={() => scan.setError(null)}
        />
      </div>

      {r ? (
        <>
          {r.mode === 'demo' && (
            <MessageBar layout="multiline" intent="warning">
              <MessageBarBody>
                You are looking at <b>sample data</b>. The businesses and contact details are fictional, but they go through
                the same Jaipur check and scoring as real ads.
              </MessageBarBody>
            </MessageBar>
          )}
          <Kpis result={r} />
          <TopThree companies={r.companies} onOpen={setOpen} />
          <Insights companies={r.companies} />
          <CompanyTable result={r} onOpen={setOpen} />
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button appearance="subtle" icon={<ArrowClockwise20Regular />} onClick={scan.clear} disabled={scan.running}>
              Clear results
            </Button>
          </div>
        </>
      ) : (
        !scan.running && (
          <div className="surface empty">
            <Megaphone24Regular />
            <h3>No results yet</h3>
            <p>Press <b>Find companies</b> to search live ads, or <b>Show sample data</b> to see how it works.</p>
          </div>
        )
      )}

      <CompanyDrawer company={open} onClose={() => setOpen(null)} isDemo={r?.mode === 'demo'} />
    </>
  );
}
