'use client';

import * as React from 'react';
import {
  Avatar,
  Button,
  Dropdown,
  Option,
  SearchBox,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Tooltip,
  Badge,
} from '@fluentui/react-components';
import {
  Building24Regular,
  Megaphone24Regular,
  ContactCard24Regular,
  DataTrending24Regular,
  ArrowDownload20Regular,
  Call16Regular,
  Mail16Regular,
  Globe16Regular,
  Chat16Regular,
  ChevronRight16Regular,
} from '@fluentui/react-icons';
import type { Company, ScanResult } from '@/lib/types';
import { contactCount } from '@/lib/contacts';
import { companiesToCsv } from '@/lib/csv';
import { ScoreBar, TierBadge, JaipurBadge, plural } from './ui';

/* ---------- KPI tiles ---------- */
export function Kpis({ result }: { result: ScanResult }) {
  const cs = result.companies;
  const withContact = cs.filter((c) => c.contacts.phones.length || c.contacts.emails.length || c.contacts.whatsapp.length).length;
  const activeAds = cs.reduce((s, c) => s + c.activeAds, 0);
  const top = cs.filter((c) => c.score >= 75).length;
  const tiles = [
    { icon: <Building24Regular />, value: cs.length, label: 'Jaipur companies found' },
    { icon: <Megaphone24Regular />, value: activeAds, label: 'Active ads running' },
    { icon: <DataTrending24Regular />, value: top, label: 'Top performers (score 75+)' },
    { icon: <ContactCard24Regular />, value: withContact, label: 'Companies with phone or email' },
  ];
  return (
    <div className="kpis">
      {tiles.map((t) => (
        <div className="kpi" key={t.label}>
          <div className="kpi-icon">{t.icon}</div>
          <div>
            <div className="kpi-value">{t.value.toLocaleString('en-IN')}</div>
            <div className="kpi-label">{t.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Top 3 ---------- */
export function TopThree({ companies, onOpen }: { companies: Company[]; onOpen: (c: Company) => void }) {
  const top = companies.slice(0, 3);
  if (top.length === 0) return null;
  return (
    <>
      <div className="section-title">
        <h2>Best performing companies</h2>
        <p>Ranked by Performance Score. Click a card to see ads and contacts.</p>
      </div>
      <div className="podium">
        {top.map((c, i) => (
          <button className="podium-card" key={c.id} onClick={() => onOpen(c)} aria-label={`Open ${c.name}`}>
            <div className="podium-head">
              <span className={`rank-badge rank-${i + 1}`}>#{i + 1}</span>
              <Avatar name={c.name} color="colorful" image={c.avatarUrl ? { src: c.avatarUrl } : undefined} />
              <div style={{ minWidth: 0 }}>
                <div className="podium-name">{c.name}</div>
                <div className="podium-cat">{c.category}</div>
              </div>
            </div>
            <div className="podium-score">
              <b>{c.score}</b>
              <span>/ 100 performance score</span>
            </div>
            <div><TierBadge tier={c.tier} /></div>
            <div className="podium-stats">
              <div><b>{c.activeAds}</b>active ads</div>
              <div><b>{c.longestRunningDays}d</b>longest ad</div>
              <div><b>{c.platforms.length}</b>{c.platforms.length === 1 ? 'platform' : 'platforms'}</div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

/* ---------- Insights: categories + score spread ---------- */
export function Insights({ companies }: { companies: Company[] }) {
  const byCat = new Map<string, number>();
  companies.forEach((c) => byCat.set(c.category, (byCat.get(c.category) ?? 0) + 1));
  const cats = Array.from(byCat.entries()).sort((a, b) => b[1] - a[1]);
  const maxCat = Math.max(1, ...cats.map((c) => c[1]));
  const tiers = ['Top performer', 'Strong', 'Moderate', 'Getting started'].map((t) => ({
    t,
    n: companies.filter((c) => c.tier === t).length,
  }));
  const maxTier = Math.max(1, ...tiers.map((x) => x.n));
  const fills = ['var(--colorPaletteGreenBackground3)', 'var(--colorBrandBackground)', 'var(--colorPaletteMarigoldBackground3)', 'var(--colorNeutralStroke1)'];
  return (
    <div className="insights" style={{ marginTop: 16 }}>
      <section className="surface">
        <h2>Advertisers by business type</h2>
        <p className="sub">Which kinds of Jaipur businesses are advertising the most</p>
        <div className="bar-list">
          {cats.map(([name, n]) => (
            <div className="bar-row" key={name}>
              <span>{name}</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${(n / maxCat) * 100}%` }} /></div>
              <b>{n}</b>
            </div>
          ))}
        </div>
      </section>
      <section className="surface">
        <h2>Performance levels</h2>
        <p className="sub">How many companies are in each level</p>
        <div className="bar-list">
          {tiers.map((x, i) => (
            <div className="bar-row" key={x.t} style={{ gridTemplateColumns: '120px 1fr 28px' }}>
              <span>{x.t}</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${(x.n / maxTier) * 100}%`, background: fills[i] }} /></div>
              <b>{x.n}</b>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ---------- Leaderboard table ---------- */
const SHORT: Record<string, string> = { Facebook: 'FB', Instagram: 'IG', Messenger: 'Msgr', 'Audience Network': 'AN', Threads: 'Threads', WhatsApp: 'WA' };
type SortKey = 'score' | 'activeAds' | 'longest' | 'name';
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'score', label: 'Performance score' },
  { key: 'activeAds', label: 'Most active ads' },
  { key: 'longest', label: 'Longest running ad' },
  { key: 'name', label: 'Name (A–Z)' },
];

export function CompanyTable({ result, onOpen }: { result: ScanResult; onOpen: (c: Company) => void }) {
  const [q, setQ] = React.useState('');
  const [cat, setCat] = React.useState('all');
  const [onlyPhone, setOnlyPhone] = React.useState(false);
  const [strictJaipur, setStrictJaipur] = React.useState(true);
  const [sort, setSort] = React.useState<SortKey>('score');

  const rankOf = React.useMemo(() => new Map(result.companies.map((c, i) => [c.id, i + 1])), [result.companies]);
  const cats = React.useMemo(() => Array.from(new Set(result.companies.map((c) => c.category))).sort(), [result.companies]);

  const rows = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = result.companies.filter(
      (c) =>
        (!needle || c.name.toLowerCase().includes(needle) || c.category.toLowerCase().includes(needle)) &&
        (cat === 'all' || c.category === cat) &&
        (!onlyPhone || c.contacts.phones.length > 0) &&
        (!strictJaipur || c.jaipur.level !== 'Low')
    );
    const by: Record<SortKey, (a: Company, b: Company) => number> = {
      score: (a, b) => b.score - a.score,
      activeAds: (a, b) => b.activeAds - a.activeAds,
      longest: (a, b) => b.longestRunningDays - a.longestRunningDays,
      name: (a, b) => a.name.localeCompare(b.name),
    };
    return [...list].sort(by[sort]);
  }, [result.companies, q, cat, onlyPhone, strictJaipur, sort]);

  const download = () => {
    const blob = new Blob([companiesToCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `jaipur-advertisers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <>
      <div className="section-title">
        <h2>All companies</h2>
        <p>Click any row to see the company’s ads and contact details.</p>
      </div>
      <div className="table-card">
        <div className="toolbar">
          <SearchBox className="grow" placeholder="Search by company or business type" value={q} onChange={(_, d) => setQ(d.value)} aria-label="Search companies" />
          <Dropdown
            aria-label="Business type"
            value={cat === 'all' ? 'All business types' : cat}
            selectedOptions={[cat]}
            onOptionSelect={(_, d) => setCat(d.optionValue ?? 'all')}
            style={{ minWidth: 200 }}
          >
            <Option value="all">All business types</Option>
            {cats.map((c) => (
              <Option key={c} value={c}>{c}</Option>
            ))}
          </Dropdown>
          <Dropdown
            aria-label="Sort by"
            value={`Sort: ${SORTS.find((s) => s.key === sort)!.label}`}
            selectedOptions={[sort]}
            onOptionSelect={(_, d) => setSort(d.optionValue as SortKey)}
            style={{ minWidth: 230 }}
          >
            {SORTS.map((s) => (
              <Option key={s.key} value={s.key}>{s.label}</Option>
            ))}
          </Dropdown>
          <Switch label="Has phone number" checked={onlyPhone} onChange={(_, d) => setOnlyPhone(d.checked)} />
          <Tooltip content="Hide companies with only a weak Jaipur match" relationship="description">
            <Switch label="Strong Jaipur match" checked={strictJaipur} onChange={(_, d) => setStrictJaipur(d.checked)} />
          </Tooltip>
          <Button icon={<ArrowDownload20Regular />} onClick={download} disabled={rows.length === 0}>
            Download Excel (CSV)
          </Button>
        </div>
        <div className="table-scroll">
          <Table aria-label="Jaipur companies ranked by ad performance">
            <TableHeader>
              <TableRow>
                <TableHeaderCell style={{ width: 56 }}>Rank</TableHeaderCell>
                <TableHeaderCell>Company</TableHeaderCell>
                <TableHeaderCell style={{ width: 170 }}>Performance</TableHeaderCell>
                <TableHeaderCell style={{ width: 140 }}>Level</TableHeaderCell>
                <TableHeaderCell style={{ width: 90 }}>Active ads</TableHeaderCell>
                <TableHeaderCell style={{ width: 120 }}>Longest ad</TableHeaderCell>
                <TableHeaderCell style={{ width: 140 }}>Platforms</TableHeaderCell>
                <TableHeaderCell style={{ width: 110 }}>Contacts</TableHeaderCell>
                <TableHeaderCell style={{ width: 100 }}>Jaipur match</TableHeaderCell>
                <TableHeaderCell style={{ width: 44 }} aria-label="Open" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow
                  key={c.id}
                  className="row-click"
                  onClick={() => onOpen(c)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen(c))}
                  tabIndex={0}
                  aria-label={`${c.name}, score ${c.score}`}
                >
                  <TableCell><b>#{rankOf.get(c.id)}</b></TableCell>
                  <TableCell>
                    <div className="company-cell">
                      <Avatar size={32} name={c.name} color="colorful" image={c.avatarUrl ? { src: c.avatarUrl } : undefined} />
                      <div>
                        <div className="company-name">{c.name}</div>
                        <div className="company-sub">{c.category}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><ScoreBar score={c.score} /></TableCell>
                  <TableCell><TierBadge tier={c.tier} /></TableCell>
                  <TableCell>{c.activeAds}</TableCell>
                  <TableCell>{plural(c.longestRunningDays, 'day')}</TableCell>
                  <TableCell>
                    <span className="plat" title={c.platforms.join(', ')}>
                      {c.platforms.map((pl) => (
                        <span key={pl}>{SHORT[pl] ?? pl}</span>
                      ))}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="contact-icons" aria-label={`${contactCount(c.contacts)} contact details`}>
                      <span className={c.contacts.phones.length ? 'on' : ''} title="Phone"><Call16Regular /></span>
                      <span className={c.contacts.whatsapp.length ? 'on' : ''} title="WhatsApp"><Chat16Regular /></span>
                      <span className={c.contacts.emails.length ? 'on' : ''} title="Email"><Mail16Regular /></span>
                      <span className={c.contacts.websites.length ? 'on' : ''} title="Website"><Globe16Regular /></span>
                    </div>
                  </TableCell>
                  <TableCell><JaipurBadge level={c.jaipur.level} /></TableCell>
                  <TableCell><ChevronRight16Regular /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {rows.length === 0 && <div className="empty">No companies match these filters.</div>}
        <div className="table-foot">
          Showing {plural(rows.length, 'company', 'companies')} of {result.companies.length} ·{' '}
          {plural(result.adsChecked, 'ad')} checked · {plural(result.rejected, 'advertiser')} outside Jaipur removed ·{' '}
          {result.mode === 'demo' ? <Badge appearance="tint" color="warning">Sample data</Badge> : <Badge appearance="tint" color="success">Live data</Badge>}{' '}
          · Updated {new Date(result.scannedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
        </div>
      </div>
    </>
  );
}
