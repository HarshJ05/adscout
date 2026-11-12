'use client';

import * as React from 'react';
import Link from 'next/link';
import { Avatar, Badge, Button, Dropdown, Option, SearchBox, Switch } from '@fluentui/react-components';
import type { Ad, Company } from '@/lib/types';
import { cityById } from '@/lib/cities';
import { useLocalStore } from '@/lib/store';
import { resultStore } from '@/lib/stores';
import { CompanyDrawer } from './CompanyDrawer';
import { plural } from './ui';

const GRADIENTS: Record<string, [string, string]> = {
  'Real estate': ['#0E5A3F', '#04140D'],
  'Education & coaching': ['#12405A', '#05121B'],
  'Clinics & hospitals': ['#0F4F4A', '#041617'],
  'Restaurants & cafes': ['#5A3A12', '#1A0F05'],
  'Fashion & jewellery': ['#6A5216', '#1C1505'],
  'Salons & fitness': ['#4A1E3A', '#150710'],
  'Furniture & interiors': ['#3E3A2A', '#100F08'],
  'Travel & hotels': ['#1E3E5A', '#07111B'],
  'Cars & bikes': ['#2E3338', '#0B0D0F'],
};
const gradientFor = (cat: string) => GRADIENTS[cat] ?? ['#1D3328', '#07100B'];

/** First sentence of the ad, short enough to read as a headline. */
const headlineOf = (a: Ad) => {
  const t = (a.title && a.title !== a.pageName ? a.title : a.text).split('\n')[0];
  const first = t.split(/(?<=[.!?])\s/)[0] ?? t;
  return first.length > 80 ? `${first.slice(0, 77)}…` : first;
};

type Sort = 'longest' | 'newest' | 'score';

export function AdGallery() {
  const result = useLocalStore(resultStore);
  const [q, setQ] = React.useState('');
  const [cat, setCat] = React.useState('all');
  const [platform, setPlatform] = React.useState('all');
  const [activeOnly, setActiveOnly] = React.useState(true);
  const [sort, setSort] = React.useState<Sort>('longest');
  const [open, setOpen] = React.useState<Company | null>(null);
  const [limit, setLimit] = React.useState(40);

  const items = React.useMemo(() => {
    if (!result) return [];
    return result.companies.flatMap((c) => c.ads.map((a) => ({ a, c })));
  }, [result]);
  const cats = React.useMemo(() => Array.from(new Set(items.map((x) => x.c.category))).sort(), [items]);
  const platforms = React.useMemo(() => Array.from(new Set(items.flatMap((x) => x.a.platforms))).sort(), [items]);

  const shown = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = items.filter(
      ({ a, c }) =>
        (!activeOnly || a.isActive) &&
        (cat === 'all' || c.category === cat) &&
        (platform === 'all' || a.platforms.includes(platform)) &&
        (!needle || [c.name, c.area ?? '', a.text, a.title ?? ''].some((v) => v.toLowerCase().includes(needle)))
    );
    const by: Record<Sort, (x: (typeof list)[0], y: (typeof list)[0]) => number> = {
      longest: (x, y) => y.a.daysRunning - x.a.daysRunning,
      newest: (x, y) => x.a.daysRunning - y.a.daysRunning,
      score: (x, y) => y.c.score - x.c.score,
    };
    return [...list].sort(by[sort]);
  }, [items, q, cat, platform, activeOnly, sort]);

  if (!result) {
    return (
      <>
        <div className="page-head"><div><h1>Ad gallery</h1><p>Every ad from your latest search, in one place.</p></div></div>
        <div className="surface empty">
          <h3>No ads to show yet</h3>
          <p>Run a search on the dashboard and every ad it finds appears here, ready to browse and filter.</p>
          <div className="page-actions" style={{ justifyContent: 'center' }}>
            <Link href="/dashboard"><Button appearance="primary">Go to dashboard</Button></Link>
            <Link href="/dashboard?demo=1"><Button>Load sample data</Button></Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Ad gallery</h1>
          <p>
            {plural(items.length, 'ad')} from {plural(result.companies.length, `${cityById(result.city).name} company`, `${cityById(result.city).name} companies`)}. See what each business is
            saying, how long it has been saying it, and where.
          </p>
        </div>
        {result.mode === 'demo' && <Badge appearance="tint" color="warning" size="large">Sample data</Badge>}
      </div>

      <div className="surface" style={{ padding: 14, marginBottom: 18 }}>
        <div className="toolbar" style={{ padding: 0, border: 0 }}>
          <SearchBox className="grow" placeholder="Search ad text, company or area" value={q} onChange={(_, d) => setQ(d.value)} aria-label="Search ads" />
          <Dropdown aria-label="Business type" value={cat === 'all' ? 'All business types' : cat} selectedOptions={[cat]} onOptionSelect={(_, d) => setCat(d.optionValue ?? 'all')} style={{ minWidth: 190 }}>
            <Option value="all">All business types</Option>
            {cats.map((c) => <Option key={c} value={c}>{c}</Option>)}
          </Dropdown>
          <Dropdown aria-label="Platform" value={platform === 'all' ? 'All platforms' : platform} selectedOptions={[platform]} onOptionSelect={(_, d) => setPlatform(d.optionValue ?? 'all')} style={{ minWidth: 150 }}>
            <Option value="all">All platforms</Option>
            {platforms.map((p) => <Option key={p} value={p}>{p}</Option>)}
          </Dropdown>
          <Dropdown aria-label="Sort" value={sort === 'longest' ? 'Running longest' : sort === 'newest' ? 'Newest first' : 'Best company score'} selectedOptions={[sort]} onOptionSelect={(_, d) => setSort(d.optionValue as Sort)} style={{ minWidth: 170 }}>
            <Option value="longest">Running longest</Option>
            <Option value="newest">Newest first</Option>
            <Option value="score">Best company score</Option>
          </Dropdown>
          <Switch label="Active only" checked={activeOnly} onChange={(_, d) => setActiveOnly(d.checked)} />
        </div>
      </div>

      <p style={{ color: '#93A89E', fontSize: 13, margin: '0 0 14px' }}>Showing {Math.min(limit, shown.length)} of {plural(shown.length, 'ad')}</p>

      <div className="ad-grid">
        {shown.slice(0, limit).map(({ a, c }) => {
          const [g1, g2] = gradientFor(c.category);
          return (
            <button className="ad-tile" key={a.id} onClick={() => setOpen(c)} aria-label={`${c.name}: ${headlineOf(a)}`}>
              <div className="ad-visual" style={{ background: `radial-gradient(120% 100% at 15% 0%, ${g1}, ${g2})` }}>
                {a.imageUrl && <img src={a.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />}
                {!a.imageUrl && <span className="headline">{headlineOf(a)}</span>}
                {a.cta && <span className="cta">{a.cta}</span>}
              </div>
              <div className="ad-info">
                <div className="ad-co">
                  <Avatar size={24} name={c.name} color="colorful" image={c.avatarUrl ? { src: c.avatarUrl } : undefined} />
                  {c.name}
                </div>
                <p className="ad-text">{a.text}</p>
                <div className="ad-tags">
                  <Badge appearance="tint" color={a.isActive ? 'success' : 'subtle'} size="small">{a.isActive ? 'Active' : 'Stopped'}</Badge>
                  <span>{plural(a.daysRunning, 'day')}</span>
                  {c.area && <span>· {c.area}</span>}
                  {a.platforms.map((p) => <Badge key={p} appearance="outline" size="small">{p}</Badge>)}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {shown.length === 0 && <div className="surface empty"><p>No ads match these filters.</p></div>}
      {shown.length > limit && (
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <Button onClick={() => setLimit((n) => n + 40)}>Show more ads</Button>
        </div>
      )}

      <CompanyDrawer company={open} onClose={() => setOpen(null)} isDemo={result.mode === 'demo'} />
    </>
  );
}
