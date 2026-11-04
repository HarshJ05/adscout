'use client';

import * as React from 'react';
import {
  OverlayDrawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Button,
  Avatar,
  Badge,
  Tooltip,
  useToastController,
  Toast,
  ToastTitle,
  Toaster,
  useId,
} from '@fluentui/react-components';
import {
  Dismiss24Regular,
  Call16Regular,
  Mail16Regular,
  Globe16Regular,
  Chat16Regular,
  Location16Regular,
  Copy16Regular,
  Open16Regular,
  Camera16Regular,
  Clock16Regular,
} from '@fluentui/react-icons';
import type { Company } from '@/lib/types';
import { WEIGHTS } from '@/lib/scoring';
import { TierBadge, JaipurBadge, waLink, plural } from './ui';

export function CompanyDrawer({ company, onClose, isDemo }: { company: Company | null; onClose: () => void; isDemo: boolean }) {
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);
  // "Show all ads" is remembered per company, so opening another company starts collapsed.
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const showAll = !!company && expandedId === company.id;
  const setShowAll = (fn: (x: boolean) => boolean) => setExpandedId(fn(showAll) && company ? company.id : null);

  const copy = async (v: string) => {
    try {
      await navigator.clipboard.writeText(v);
      dispatchToast(<Toast><ToastTitle>Copied {v}</ToastTitle></Toast>, { intent: 'success', timeout: 2000 });
    } catch {
      /* clipboard blocked */
    }
  };

  const c = company;
  const ct = c?.contacts;
  const lines: { icon: React.ReactNode; label: string; value: string; href?: string; action?: string }[] = [];
  if (ct) {
    ct.phones.forEach((v) => lines.push({ icon: <Call16Regular />, label: 'Phone', value: v, href: `tel:${v.replace(/\s/g, '')}`, action: 'Call' }));
    ct.whatsapp.forEach((v) => lines.push({ icon: <Chat16Regular />, label: 'WhatsApp', value: v, href: waLink(v), action: 'Chat' }));
    ct.emails.forEach((v) => lines.push({ icon: <Mail16Regular />, label: 'Email', value: v, href: `mailto:${v}`, action: 'Email' }));
    ct.websites.forEach((v) => lines.push({ icon: <Globe16Regular />, label: 'Website', value: v.replace(/^https?:\/\//, ''), href: v, action: 'Open' }));
    ct.instagram.forEach((v) => lines.push({ icon: <Camera16Regular />, label: 'Instagram', value: v, href: `https://instagram.com/${v.slice(1)}`, action: 'Open' }));
    if (ct.address) lines.push({ icon: <Location16Regular />, label: 'Address', value: ct.address, href: `https://www.google.com/maps/search/${encodeURIComponent(ct.address)}`, action: 'Map' });
  }

  const parts = c
    ? [
        { name: 'Active ads', got: c.scoreParts.activity, max: WEIGHTS.activity, note: plural(c.activeAds, 'ad') + ' live now' },
        { name: 'Ad lifespan', got: c.scoreParts.longevity, max: WEIGHTS.longevity, note: `longest ad: ${plural(c.longestRunningDays, 'day')}` },
        { name: 'Platforms', got: c.scoreParts.reach, max: WEIGHTS.reach, note: c.platforms.join(', ') || 'none' },
        { name: 'New ads', got: c.scoreParts.freshness, max: WEIGHTS.freshness, note: `${c.newAds30d} started in last 30 days` },
      ]
    : [];

  const ads = c ? (showAll ? c.ads : c.ads.slice(0, 4)) : [];

  return (
    <>
      <Toaster toasterId={toasterId} position="bottom" />
      <OverlayDrawer open={!!c} onOpenChange={(_, d) => !d.open && onClose()} position="end" size="medium">
        {c && (
          <>
            <DrawerHeader>
              <DrawerHeaderTitle action={<Button appearance="subtle" aria-label="Close" icon={<Dismiss24Regular />} onClick={onClose} />}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={c.name} color="colorful" size={40} image={c.avatarUrl ? { src: c.avatarUrl } : undefined} />
                  <span>
                    <span style={{ display: 'block' }}>{c.name}</span>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 400, color: 'var(--colorNeutralForeground3)' }}>{c.category}</span>
                  </span>
                </span>
              </DrawerHeaderTitle>
            </DrawerHeader>
            <DrawerBody>
              <div className="drawer-section" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 40, fontWeight: 600, color: 'var(--colorBrandForeground1)', lineHeight: 1 }}>{c.score}</span>
                <span style={{ color: 'var(--colorNeutralForeground3)' }}>/ 100</span>
                <TierBadge tier={c.tier} />
              </div>

              <div className="drawer-section">
                <h3>Contact details</h3>
                {lines.length === 0 ? (
                  <p style={{ fontSize: 14, color: 'var(--colorNeutralForeground3)', margin: 0 }}>
                    No contact details were found in the ads or on the website. Try the Facebook page link below.
                  </p>
                ) : (
                  lines.map((l, i) => (
                    <div className="contact-line" key={i}>
                      {l.icon}
                      <span className="lbl">{l.label}</span>
                      <span className="val">{l.value}</span>
                      {l.href && (
                        <Button size="small" appearance="primary" as="a" href={l.href} target="_blank" rel="noreferrer">
                          {l.action}
                        </Button>
                      )}
                      <Tooltip content="Copy" relationship="label">
                        <Button size="small" appearance="subtle" icon={<Copy16Regular />} onClick={() => copy(l.value)} />
                      </Tooltip>
                    </div>
                  ))
                )}
                {isDemo && (
                  <p style={{ fontSize: 12, color: 'var(--colorNeutralForeground3)' }}>Sample data: these contact details are fictional.</p>
                )}
              </div>

              <div className="drawer-section">
                <h3>Open elsewhere</h3>
                <div className="link-grid">
                  <Button as="a" href={c.metaLibraryUrl} target="_blank" rel="noreferrer" icon={<Open16Regular />}>All ads in Meta Ads Library</Button>
                  <Button as="a" href={c.googleAdsUrl} target="_blank" rel="noreferrer" icon={<Open16Regular />}>Google ads (Transparency Center)</Button>
                  {c.pageUrl && (
                    <Button as="a" href={c.pageUrl} target="_blank" rel="noreferrer" icon={<Open16Regular />}>Facebook page</Button>
                  )}
                </div>
              </div>

              <div className="drawer-section">
                <h3>Why this score</h3>
                <div className="score-break">
                  {parts.map((p) => (
                    <div key={p.name}>
                      <div className="score-break-row">
                        <span>{p.name}</span>
                        <div className="bar-track"><div className="bar-fill" style={{ width: `${(p.got / p.max) * 100}%` }} /></div>
                        <b>{p.got}/{p.max}</b>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--colorNeutralForeground3)', marginLeft: 120 }}>{p.note}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="drawer-section">
                <h3 style={{ display: 'flex', gap: 8, alignItems: 'center' }}>Why we think it’s in Jaipur <JaipurBadge level={c.jaipur.level} /></h3>
                <ul className="signal-list">
                  {c.jaipur.signals.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="drawer-section">
                <h3>Ads ({c.totalAds})</h3>
                {ads.map((a) => (
                  <article className="ad-card" key={a.id}>
                    <div className="ad-media">
                      {a.imageUrl ? <img src={a.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span>{a.cta ?? 'Ad'}</span>}
                    </div>
                    <div className="ad-body">{a.text || a.title || '(No text in this ad)'}</div>
                    <div className="ad-meta">
                      <Badge appearance="tint" color={a.isActive ? 'success' : 'subtle'}>{a.isActive ? 'Active' : 'Stopped'}</Badge>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock16Regular /> {plural(a.daysRunning, 'day')}</span>
                      {a.startDate && <span>· since {new Date(a.startDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>}
                      {a.platforms.map((p) => (
                        <Badge key={p} appearance="outline" color="informative">{p}</Badge>
                      ))}
                      {!isDemo && (
                        <a href={a.libraryUrl} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto' }}>View ad</a>
                      )}
                    </div>
                  </article>
                ))}
                {c.ads.length > 4 && (
                  <Button appearance="secondary" onClick={() => setShowAll((x) => !x)}>
                    {showAll ? 'Show fewer ads' : `Show all ${c.ads.length} ads`}
                  </Button>
                )}
              </div>
            </DrawerBody>
          </>
        )}
      </OverlayDrawer>
    </>
  );
}
