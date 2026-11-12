'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge, Button, Input } from '@fluentui/react-components';
import { DocumentPdf20Regular } from '@fluentui/react-icons';
import { useLocalStore } from '@/lib/store';
import { resultStore } from '@/lib/stores';
import { WEIGHTS } from '@/lib/scoring';
import { Logo } from './Logo';
import { CityMap } from './CityMap';
import { cityById } from '@/lib/cities';

function Bars({ rows, gold }: { rows: [string, number][]; gold?: boolean }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <div className={`report-bars${gold ? ' gold' : ''}`}>
      {rows.map(([k, v]) => (
        <div key={k}>
          <span>{k}</span>
          <i style={{ width: `${(v / max) * 100}%` }} />
          <b>{v}</b>
        </div>
      ))}
    </div>
  );
}

const countBy = (xs: (string | null)[]) => {
  const m = new Map<string, number>();
  xs.forEach((x) => x && m.set(x, (m.get(x) ?? 0) + 1));
  return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
};

export function ReportView() {
  const result = useLocalStore(resultStore);
  const [client, setClient] = React.useState('');

  if (!result) {
    return (
      <>
        <div className="page-head"><div><h1>Report</h1><p>A clean, printable summary of your latest search.</p></div></div>
        <div className="surface empty">
          <h3>Nothing to report yet</h3>
          <p>Run a search on the dashboard first. The report is built from your latest results.</p>
          <div className="page-actions" style={{ justifyContent: 'center' }}>
            <Link href="/dashboard"><Button appearance="primary">Go to dashboard</Button></Link>
            <Link href="/dashboard?demo=1"><Button>Load sample data</Button></Link>
          </div>
        </div>
      </>
    );
  }

  const cs = result.companies;
  const city = cityById(result.city);
  const top = cs.slice(0, 10);
  const activeAds = cs.reduce((s, c) => s + c.activeAds, 0);
  const withContact = cs.filter((c) => c.contacts.phones.length || c.contacts.emails.length).length;
  const date = new Date(result.scannedAt).toLocaleDateString('en-IN', { dateStyle: 'long' });

  return (
    <>
      <div className="page-head no-print">
        <div>
          <h1>Report</h1>
          <p>Add who it is for, then download it as a PDF. In the print window choose “Save as PDF”.</p>
        </div>
        <div className="page-actions">
          <Input placeholder="Prepared for (optional)" value={client} onChange={(_, d) => setClient(d.value)} aria-label="Prepared for" style={{ minWidth: 230 }} />
          <Button appearance="primary" icon={<DocumentPdf20Regular />} onClick={() => window.print()}>Download PDF</Button>
        </div>
      </div>

      <div className="report-wrap">
        <article className="report-sheet">
          <div className="report-top">
            <div>
              <h1>{city.name} advertisers report</h1>
              <p>
                {date}
                {client ? ` · Prepared for ${client}` : ''}
                {result.mode === 'demo' ? ' · Sample data (fictional businesses)' : ''}
              </p>
            </div>
            <span className="report-brand"><Logo size={16} /> AdScout</span>
          </div>

          <div className="report-kpis">
            <div><b>{cs.length}</b><span>{city.name} companies advertising</span></div>
            <div><b>{activeAds}</b><span>Active ads running</span></div>
            <div><b>{cs.filter((c) => c.score >= 75).length}</b><span>Top performers (75+)</span></div>
            <div><b>{withContact}</b><span>With phone or email</span></div>
          </div>

          <h2>Top 10 advertisers</h2>
          <table className="report-table">
            <thead>
              <tr><th>#</th><th>Company</th><th>Score</th><th>Active ads</th><th>Longest ad</th><th>Phone</th><th>Email or website</th></tr>
            </thead>
            <tbody>
              {top.map((c, i) => (
                <tr key={c.id}>
                  <td><b>{i + 1}</b></td>
                  <td><b>{c.name}</b><br /><span style={{ color: '#4A5B53' }}>{c.category}{c.area ? `, ${c.area}` : ''}</span></td>
                  <td><b>{c.score}</b> <span className="report-tier">{c.tier}</span></td>
                  <td>{c.activeAds}</td>
                  <td>{c.longestRunningDays} days</td>
                  <td>{c.contacts.phones[0] ?? '–'}</td>
                  <td style={{ wordBreak: 'break-word' }}>{c.contacts.emails[0] ?? c.contacts.websites[0]?.replace(/^https?:\/\//, '') ?? '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="report-two">
            <div>
              <h2>Advertisers by business type</h2>
              <Bars rows={countBy(cs.map((c) => c.category))} />
            </div>
            <div>
              <h2>Busiest areas</h2>
              <Bars rows={countBy(cs.map((c) => c.area))} gold />
            </div>
          </div>

          <h2>Where they are</h2>
          <div className="report-map">
            <CityMap city={city} companies={cs} scanning={false} revealKey={`report-${result.scannedAt}`} activeArea={null} onOpen={() => {}} onPickArea={() => {}} />
          </div>

          <h2>How this was measured</h2>
          <p className="report-note">
            Ads come from the public Meta Ads Library (India, active ads). An advertiser is counted as a {city.name} business when
            its ads or pages mention {city.name}, a {city.name} PIN code ({city.pinPrefixes.map((p) => `${p}xxx`).join(' or ')}), the
            0{city.std} phone code or a known {city.name} area.
            The performance score (0–100) combines active ads ({WEIGHTS.activity} points), how long the longest ad has run
            ({WEIGHTS.longevity}), platforms used ({WEIGHTS.reach}) and new ads in the last 30 days ({WEIGHTS.freshness}).
            Meta does not publish spend for ordinary business ads in India, so the score estimates activity rather than
            measuring sales or budget.
          </p>
          {result.mode === 'demo' && (
            <p className="report-note"><Badge appearance="tint" color="warning">Sample data</Badge> All businesses and contact details in this report are fictional.</p>
          )}

          <div className="report-foot">
            <span>AdScout · {date}</span>
            <span>Contact details are public business information. Use them in line with India’s DPDP Act.</span>
          </div>
        </article>
      </div>
    </>
  );
}
