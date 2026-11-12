'use client';

import * as React from 'react';
import type { Company } from '@/lib/types';
import { coordsIn, type City } from '@/lib/cities';
import { tierFill } from './ui';

/* Schematic map of the chosen city. Advertisers are drawn on the area their ads name,
 * sized by Performance Score. Positions are approximate on purpose. */

const W = 560;
const PAD = 18;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Equirectangular projection fitted to the city's bounds; the frame height follows the city's shape. */
function projection(city: City) {
  const { n, s, w, e } = city.bounds;
  const k = Math.cos(((n + s) / 2) * (Math.PI / 180));
  const H = Math.round(clamp(W * ((n - s) / ((e - w) * k)), 420, 680));
  const px = (lat: number, lng: number) => ({
    x: clamp(PAD + ((lng - w) / (e - w)) * (W - PAD * 2), PAD, W - PAD),
    y: clamp(PAD + ((n - lat) / (n - s)) * (H - PAD * 2), PAD, H - PAD),
  });
  return { H, px };
}

/** Place labels without overlaps: try four spots around each point, skip a label if none is free. */
type Box = { x: number; y: number; w: number; h: number };
const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
function placeLabels(items: { key: string; x: number; y: number; r: number; text: string }[], blocked: Box[], H: number) {
  const placed: Box[] = [...blocked];
  const out: { key: string; x: number; y: number; anchor: 'start' | 'end' | 'middle' }[] = [];
  for (const it of items) {
    const w = it.text.length * 7.2 + 6;
    const h = 16;
    const g = it.r + 5; // clear of the area's own dot
    const options: { x: number; y: number; anchor: 'start' | 'end' | 'middle'; box: Box }[] = [
      { x: it.x + g, y: it.y + 4, anchor: 'start', box: { x: it.x + g - 2, y: it.y - 9, w, h } },
      { x: it.x - g, y: it.y + 4, anchor: 'end', box: { x: it.x - g - w + 2, y: it.y - 9, w, h } },
      { x: it.x, y: it.y - g - 4, anchor: 'middle', box: { x: it.x - w / 2, y: it.y - g - 17, w, h } },
      { x: it.x, y: it.y + g + 12, anchor: 'middle', box: { x: it.x - w / 2, y: it.y + g, w, h } },
    ];
    const fit = options.find((o) => o.box.x >= 2 && o.box.x + o.box.w <= W - 2 && o.box.y >= 2 && o.box.y + o.box.h <= H - 2 && !placed.some((p) => overlaps(p, o.box)));
    if (fit) {
      placed.push(fit.box);
      out.push({ key: it.key, x: fit.x, y: fit.y, anchor: fit.anchor });
    }
  }
  return out;
}

const ROADS: { name: string; pts: [number, number][]; label: [number, number] }[] = [
  { name: 'Tonk Rd', pts: [[26.915, 75.812], [26.86, 75.8], [26.76, 75.8]], label: [26.785, 75.808] },
  { name: 'Ajmer Rd', pts: [[26.91, 75.795], [26.89, 75.74], [26.86, 75.66]], label: [26.858, 75.705] },
  { name: 'Sikar Rd', pts: [[26.932, 75.805], [26.97, 75.775], [27.01, 75.745]], label: [26.988, 75.773] },
  { name: 'Delhi Rd', pts: [[26.932, 75.832], [26.96, 75.85], [27.01, 75.885]], label: [26.988, 75.858] },
  { name: 'Agra Rd', pts: [[26.92, 75.838], [26.906, 75.88], [26.9, 75.92]], label: [26.895, 75.888] },
];

/** Areas labelled before any search, so the map is readable on its own. */
const JAIPUR_ORIENTATION = ['Vaishali Nagar', 'Mansarovar', 'Malviya Nagar', 'Jagatpura', 'Sanganer', 'Vidhyadhar Nagar', 'Jhotwara', 'C-Scheme', 'Raja Park', 'Amer Road'];
const orientationFor = (city: City) =>
  city.landmarks === 'jaipur' ? JAIPUR_ORIENTATION : Object.keys(city.areas).filter((_, i) => i % 2 === 0).slice(0, 10);

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
};

interface Props {
  city: City;
  companies: Company[];
  scanning: boolean;
  revealKey: string;
  activeArea: string | null;
  onOpen: (c: Company) => void;
  onPickArea: (area: string | null) => void;
}

export function CityMap({ city, companies, scanning, revealKey, activeArea, onOpen, onPickArea }: Props) {
  const [hover, setHover] = React.useState<Company | null>(null);
  const { H, px } = React.useMemo(() => projection(city), [city]);
  const isJaipur = city.landmarks === 'jaipur';

  // Place each company on its area, spreading companies in the same area on a small spiral.
  const dots = React.useMemo(() => {
    const perArea = new Map<string, number>();
    return companies.map((c, rank) => {
      const key = c.area ?? '__city';
      const n = perArea.get(key) ?? 0;
      perArea.set(key, n + 1);
      const [lat, lng] = coordsIn(city, c.area) ?? city.center;
      const base = px(lat, lng);
      const angle = hash(c.id) * Math.PI * 2 + n * 2.4;
      const dist = n === 0 ? 0 : 10 + n * 6;
      return { c, rank, x: base.x + Math.cos(angle) * dist, y: base.y + Math.sin(angle) * dist, r: 5 + c.score / 12 };
    });
  }, [companies, city, px]);

  const areas = React.useMemo(() => {
    const m = new Map<string, number>();
    companies.forEach((c) => c.area && coordsIn(city, c.area) && m.set(c.area, (m.get(c.area) ?? 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [companies, city]);

  const hasResults = companies.length > 0;

  const resultLabels = React.useMemo(() => {
    const items = areas.slice(0, 10).map(([a, n]) => {
      const p = px(...coordsIn(city, a)!);
      const r = Math.max(6, ...dots.filter((d) => d.c.area === a && Math.hypot(d.x - p.x, d.y - p.y) < 2).map((d) => d.r));
      return { key: a, x: p.x, y: p.y, r, text: `${a} ${n}` };
    });
    const dotBoxes = dots.map((d) => ({ x: d.x - d.r, y: d.y - d.r, w: d.r * 2, h: d.r * 2 }));
    const blocked = [...dotBoxes];
    if (isJaipur) {
      // Keep labels off the walled city block.
      const a = px(26.933, 75.808);
      const b = px(26.913, 75.838);
      blocked.push({ x: a.x, y: a.y - 18, w: b.x - a.x, h: b.y - a.y + 18 });
    }
    return placeLabels(items, blocked, H);
  }, [areas, dots, city, px, H, isJaipur]);
  const counts = new Map(areas);
  const centre = px(...city.center);
  const wc1 = px(26.933, 75.808);
  const wc2 = px(26.913, 75.838);
  const wcW = wc2.x - wc1.x;
  const wcH = wc2.y - wc1.y;

  return (
    <figure className="map-card" aria-label={`Map of ${city.name} advertisers`}>
      <figcaption className="map-head">
        <div>
          <h2>Where {city.name}’s advertisers are</h2>
          <p>
            {scanning
              ? 'Searching the Meta Ads Library…'
              : hasResults
                ? `${companies.length} companies plotted by area. Click a dot for details, or an area to filter the list.`
                : 'Run a search and every advertiser appears here, sized by how well its ads perform.'}
          </p>
        </div>
        {activeArea && (
          <button className="area-chip" onClick={() => onPickArea(null)}>
            {activeArea} <span aria-hidden>×</span>
            <span className="sr-only">Clear area filter</span>
          </button>
        )}
      </figcaption>

      <div className="map-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className={`map-svg${scanning ? ' is-scanning' : ''}`} role="group">
          <defs>
            <radialGradient id="sweep-grad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform={`translate(${centre.x} ${centre.y}) scale(340)`}>
              <stop offset="0" stopColor="var(--colorBrandBackground)" stopOpacity="0.35" />
              <stop offset="1" stopColor="var(--colorBrandBackground)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Rings around the city centre, for a sense of distance */}
          <g className="map-rings" aria-hidden>
            {[90, 180, 270].map((r) => (
              <circle key={r} cx={centre.x} cy={centre.y} r={r} />
            ))}
          </g>

          {isJaipur && (
          <g className="map-roads" aria-hidden>
            {ROADS.map((rd) => (
              <g key={rd.name}>
                <polyline points={rd.pts.map(([la, ln]) => `${px(la, ln).x},${px(la, ln).y}`).join(' ')} />
                <text x={px(...rd.label).x} y={px(...rd.label).y} textAnchor="middle">{rd.name}</text>
              </g>
            ))}
          </g>
          )}

          {/* The walled city: Jaipur was planned on a nine-block grid */}
          {isJaipur && (
          <g className="walled-city" aria-hidden>
            <rect x={wc1.x} y={wc1.y} width={wcW} height={wcH} rx="3" />
            {[1, 2].map((i) => (
              <g key={i}>
                <line x1={wc1.x + (wcW * i) / 3} y1={wc1.y} x2={wc1.x + (wcW * i) / 3} y2={wc2.y} />
                <line x1={wc1.x} y1={wc1.y + (wcH * i) / 3} x2={wc2.x} y2={wc1.y + (wcH * i) / 3} />
              </g>
            ))}
            <text x={wc1.x + wcW / 2} y={wc1.y - 7} textAnchor="middle">Walled city</text>
          </g>
          )}

          {scanning && (
            <g className="sweep" style={{ transformOrigin: `${centre.x}px ${centre.y}px` }} aria-hidden>
              <path d={`M${centre.x} ${centre.y} L${centre.x + 340} ${centre.y} A340 340 0 0 0 ${centre.x + 340 * Math.cos(-0.7)} ${centre.y + 340 * Math.sin(-0.7)} Z`} fill="url(#sweep-grad)" />
              <line x1={centre.x} y1={centre.y} x2={centre.x + 340} y2={centre.y} />
            </g>
          )}

          {/* Area labels: orientation before a search, counts after */}
          <g className="area-labels">
            {!hasResults &&
              orientationFor(city).map((a) => {
                const [la, ln] = coordsIn(city, a)!;
                const p = px(la, ln);
                return (
                  <g key={a} aria-hidden>
                    <circle cx={p.x} cy={p.y} r="2.5" className="area-dot" />
                    <text x={p.x + 6} y={p.y + 4}>{a}</text>
                  </g>
                );
              })}
            {hasResults &&
              resultLabels.map(({ key: a, x, y, anchor }) => {
                const n = counts.get(a) ?? 0;
                const active = activeArea === a;
                return (
                  <text
                    key={a}
                    x={x}
                    y={y}
                    textAnchor={anchor}
                    className={`area-label${active ? ' active' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-pressed={active}
                    aria-label={`Show only ${a} (${n})`}
                    onClick={() => onPickArea(active ? null : a)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onPickArea(active ? null : a))}
                  >
                    {a} <tspan className="area-count">{n}</tspan>
                  </text>
                );
              })}
          </g>

          <g className="dots" key={revealKey}>
            {[...dots].reverse().map(({ c, rank, x, y, r }) => {
              const dim = activeArea && c.area !== activeArea;
              return (
                <g
                  key={c.id}
                  className={`dot${dim ? ' dim' : ''}`}
                  style={{ animationDelay: `${Math.min(rank * 45, 1400)}ms`, transformOrigin: `${x}px ${y}px` }}
                  role="button"
                  tabIndex={0}
                  aria-label={`#${rank + 1} ${c.name}, score ${c.score}${c.area ? `, ${c.area}` : ''}`}
                  onClick={() => onOpen(c)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen(c))}
                  onMouseEnter={() => setHover(c)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(c)}
                  onBlur={() => setHover(null)}
                >
                  <circle cx={x} cy={y} r={r} fill={tierFill(c.score)} />
                  {rank < 3 && (
                    <text x={x} y={y + 4} textAnchor="middle" className="dot-rank">{rank + 1}</text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {hover &&
          (() => {
            const d = dots.find((x) => x.c.id === hover.id);
            if (!d) return null;
            return (
              <div className="map-tip" style={{ left: `${(d.x / W) * 100}%`, top: `${(d.y / H) * 100}%` }} role="status">
                <b>#{d.rank + 1} {hover.name}</b>
                <span>{hover.category}{hover.area ? `, ${hover.area}` : ''}</span>
                <span>Score {hover.score} · {hover.activeAds} active ads</span>
              </div>
            );
          })()}

        {!hasResults && !scanning && <div className="map-empty">No advertisers plotted yet</div>}
      </div>

      <div className="map-legend" aria-hidden>
        <span><i style={{ background: tierFill(80) }} />Top performer</span>
        <span><i style={{ background: tierFill(60) }} />Strong</span>
        <span><i style={{ background: tierFill(30) }} />Moderate</span>
        <span><i style={{ background: tierFill(10) }} />Getting started</span>
        <span className="legend-note">Bigger dot, higher score. Positions are approximate.</span>
      </div>
    </figure>
  );
}
