'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge, Button, Dropdown, Option } from '@fluentui/react-components';
import { useLocalStore } from '@/lib/store';
import { historyStore } from '@/lib/stores';
import { compare, sampleHistory, type Snapshot } from '@/lib/history';
import { Reveal } from './Reveal';
import { useCity } from './CityPicker';

const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
const day = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/** Companies found per search, oldest to newest. One series, so no legend; the latest bar is highlighted. */
function TrendChart({ snaps }: { snaps: Snapshot[] }) {
  const [hover, setHover] = React.useState<number | null>(null);
  const data = [...snaps].reverse();
  const W = 1100;
  const H = 230;
  const pad = { l: 36, r: 12, t: 24, b: 28 };
  const max = Math.max(5, ...data.map((s) => s.companies.length));
  const step = (W - pad.l - pad.r) / data.length;
  const bw = Math.min(28, step * 0.5);
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const ticks = [0, Math.round(max / 2), max];
  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Local companies found in each search">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="rgba(214,255,233,0.07)" />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="axis">{t}</text>
          </g>
        ))}
        {data.map((s, i) => {
          const x = pad.l + step * i + (step - bw) / 2;
          const v = s.companies.length;
          const top = y(v);
          const latest = i === data.length - 1;
          const h = Math.max(2, H - pad.b - top);
          const r = Math.min(4, h / 2);
          return (
            <g key={s.scannedAt} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={pad.l + step * i} y={pad.t} width={step} height={H - pad.t - pad.b} fill="transparent" />
              <path
                className={`bar${latest ? ' latest' : ''}`}
                d={`M${x} ${H - pad.b}V${top + r}Q${x} ${top} ${x + r} ${top}H${x + bw - r}Q${x + bw} ${top} ${x + bw} ${top + r}V${H - pad.b}Z`}
                opacity={hover === null || hover === i ? 1 : 0.5}
              />
              {(latest || hover === i) && <text x={x + bw / 2} y={top - 7} textAnchor="middle" className="val">{v}</text>}
              <text x={x + bw / 2} y={H - 9} textAnchor="middle" className="axis">{day(s.scannedAt)}</text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="map-tip" style={{ left: `${((pad.l + step * hover + step / 2) / W) * 100}%`, top: `${(y(data[hover].companies.length) / H) * 100}%` }}>
          <b>{data[hover].companies.length} companies</b>
          <span>{data[hover].adsChecked} ads checked</span>
          <span>{when(data[hover].scannedAt)}</span>
        </div>
      )}
    </div>
  );
}

function ChangeList({ title, items, empty }: { title: string; items: React.ReactNode[]; empty: string }) {
  return (
    <section className="surface">
      <h2>{title}</h2>
      {items.length === 0 ? <p className="sub" style={{ margin: '8px 0 0' }}>{empty}</p> : <ul className="change-list">{items.slice(0, 8)}</ul>}
    </section>
  );
}

export function HistoryView() {
  const all = useLocalStore(historyStore);
  const city = useCity();
  const history = all.filter((s) => (s.city ?? 'jaipur') === city.id);
  const [againstAt, setAgainstAt] = React.useState<string | null>(null);
  const latest = history[0];
  const against = history.find((s) => s.scannedAt === againstAt) ?? history[1];
  const cmp = latest && against ? compare(against, latest) : null;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>History and trends</h1>
          <p>Every search is saved here, up to the last 12. Compare the latest one with an earlier search to see who started advertising, who stopped, and whose score moved.</p>
        </div>
        {history.length > 0 && (
          <div className="page-actions">
            <Button appearance="subtle" onClick={() => historyStore.set((h) => h.filter((s) => (s.city ?? 'jaipur') !== city.id))}>Clear {city.name} history</Button>
          </div>
        )}
      </div>

      {history.length === 0 && (
        <div className="surface empty">
          <h3>No {city.name} searches saved yet</h3>
          <p>Run a search on the dashboard. Each one is stored here so you can compare weeks. History is kept per city.</p>
          <Link href="/dashboard"><Button appearance="primary">Go to dashboard</Button></Link>
        </div>
      )}

      {history.length === 1 && (
        <div className="surface empty" style={{ marginBottom: 18 }}>
          <h3>One search saved</h3>
          <p>Run another search next week and the changes appear here.{latest.mode === 'demo' ? ' Or preview the page with sample history.' : ''}</p>
          {latest.mode === 'demo' && <Button appearance="primary" onClick={() => historyStore.set((h) => [...sampleHistory(latest), ...h.filter((s) => s.scannedAt !== latest.scannedAt)])}>Show sample history</Button>}
        </div>
      )}

      {history.length >= 1 && (
        <Reveal className="surface trend-card">
          <h2>{city.name} companies found in each search</h2>
          <p className="sub">Hover a bar for details. The latest search is highlighted.</p>
          <TrendChart snaps={history} />
        </Reveal>
      )}

      {cmp && latest && against && (
        <>
          <div className="section-title">
            <h2>What changed</h2>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ color: '#93A89E', fontSize: 14 }}>Latest search compared with</span>
              <Dropdown
                aria-label="Compare with"
                value={when(against.scannedAt)}
                selectedOptions={[against.scannedAt]}
                onOptionSelect={(_, d) => setAgainstAt(d.optionValue ?? null)}
                style={{ minWidth: 210 }}
              >
                {history.slice(1).map((s) => (
                  <Option key={s.scannedAt} value={s.scannedAt}>{when(s.scannedAt)}</Option>
                ))}
              </Dropdown>
              {(latest.mode === 'demo' || against.mode === 'demo') && <Badge appearance="tint" color="warning">Sample data</Badge>}
            </div>
          </div>
          <div className="change-grid">
            <ChangeList
              title={`Started advertising (${cmp.added.length})`}
              empty="No new advertisers since that search."
              items={cmp.added.map((c) => (
                <li key={c.id}><span>{c.name}<small>{c.category}{c.area ? ` in ${c.area}` : ''}</small></span><span className="delta up">New</span></li>
              ))}
            />
            <ChangeList
              title={`Stopped advertising (${cmp.stopped.length})`}
              empty="Nobody stopped advertising."
              items={cmp.stopped.map((c) => (
                <li key={c.id}><span>{c.name}<small>{c.category}{c.area ? ` in ${c.area}` : ''}</small></span><span className="delta down">Gone</span></li>
              ))}
            />
            <ChangeList
              title="Scores rising"
              empty="No scores went up."
              items={cmp.rising.map((c) => (
                <li key={c.id}><span>{c.name}<small>{c.before} → {c.after}</small></span><span className="delta up">+{c.after - c.before}</span></li>
              ))}
            />
            <ChangeList
              title="Scores falling"
              empty="No scores went down."
              items={cmp.falling.map((c) => (
                <li key={c.id}><span>{c.name}<small>{c.before} → {c.after}</small></span><span className="delta down">{c.after - c.before}</span></li>
              ))}
            />
          </div>
        </>
      )}

      {history.length > 0 && (
        <>
          <div className="section-title"><h2>All saved searches</h2></div>
          <div className="table-card table-scroll">
            <table className="scan-log">
              <thead>
                <tr><th>When</th><th>Data</th><th>Ads checked</th><th>{city.name} companies</th><th>Top performers</th></tr>
              </thead>
              <tbody>
                {history.map((s) => (
                  <tr key={s.scannedAt}>
                    <td>{when(s.scannedAt)}</td>
                    <td>{s.mode === 'demo' ? 'Sample' : 'Live'}</td>
                    <td>{s.adsChecked}</td>
                    <td>{s.companies.length}</td>
                    <td>{s.companies.filter((c) => c.score >= 75).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
