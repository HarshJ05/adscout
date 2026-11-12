'use client';

import * as React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Reveal } from '@/components/Reveal';
import type { FieldControl, Pointer } from './field';
import { CITIES, totalAreas } from '@/lib/cities';

/* ------------------------------------------------------------------ */
/* Small inline icons (Lucide shapes)                                  */
/* ------------------------------------------------------------------ */
const Icon = {
  chevron: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m9 18 6-6-6-6" /></svg>,
  arrowDown: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 5v14M19 12l-7 7-7-7" /></svg>,
  arrowUpRight: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M7 17 17 7M7 7h10v10" /></svg>,
  pointer: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12.6 12.6 19 19M4 4l7.07 17 2.51-7.39L21 11.07z" /></svg>,
};

const BG = [
  'radial-gradient(circle at 50% 45%, #10301F 0%, #07120C 42%, #030504 100%)',
  'radial-gradient(circle at 50% 58%, #0C2E28 0%, #06110E 42%, #030504 100%)',
  'radial-gradient(circle at 50% 50%, #2C230C 0%, #0F0C05 42%, #040302 100%)',
];

const FEATURES = [
  { href: '/dashboard', title: 'Live city map', body: 'Every advertiser plotted on its neighbourhood, sized by score. Click an area to see who is spending there.' },
  { href: '/leads', title: 'Lead tracker', body: 'Save companies, mark who you have contacted, keep notes, and send a ready WhatsApp or email in one click.' },
  { href: '/ads', title: 'Ad gallery', body: 'Browse every ad running in your city by business type and platform. See exactly what competitors are saying.' },
  { href: '/history', title: 'History and trends', body: 'Each search is saved. See who started advertising this week, who stopped, and whose score is climbing.' },
  { href: '/report', title: 'Client-ready report', body: 'A clean PDF with the map, top ten, charts and contacts, ready to email or present.' },
];

/* ------------------------------------------------------------------ */
/* Smooth wheel scrolling (lerp 0.09), native scrollbar and keys kept  */
/* ------------------------------------------------------------------ */
function useSmoothScroll(enabled: boolean) {
  React.useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    let target = window.scrollY;
    let current = window.scrollY;
    let raf = 0;
    let animating = false;
    const max = () => document.documentElement.scrollHeight - window.innerHeight;
    const loop = () => {
      current += (target - current) * 0.09;
      if (Math.abs(target - current) < 0.4) {
        current = target;
        animating = false;
      }
      window.scrollTo(0, current);
      if (animating) raf = requestAnimationFrame(loop);
    };
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // let pinch-zoom through
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      target = Math.max(0, Math.min(max(), target + e.deltaY * unit));
      if (!animating) {
        animating = true;
        current = window.scrollY;
        raf = requestAnimationFrame(loop);
      }
    };
    const onScroll = () => {
      if (!animating) target = current = window.scrollY;
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
    };
  }, [enabled]);
}

/* ------------------------------------------------------------------ */
/* Loader                                                              */
/* ------------------------------------------------------------------ */
function Loader({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const [value, setValue] = React.useState(0);
  const [leaving, setLeaving] = React.useState(false);
  const readyRef = React.useRef(ready);
  React.useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  React.useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let v = 0;
    let done = false;
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!readyRef.current) v += (92 - v) * 1.7 * dt;
      else {
        v += (100 - v) * 6 * dt;
        if (v >= 99.4) v = 100;
      }
      setValue(v);
      if (v >= 99.9 && readyRef.current && !done) {
        done = true;
        setTimeout(() => setLeaving(true), 140);
        setTimeout(onDone, 660);
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <div className={`lp-loader${leaving ? ' leaving' : ''}`} aria-hidden={leaving} role="status" aria-live="polite">
      <div className="lp-loader-mark"><Logo size={26} /></div>
      <div className="lp-loader-status">{value < 100 ? 'Loading the ad field' : 'Ready'}</div>
      <div className="lp-loader-track"><div className="lp-loader-fill" style={{ width: `${value}%` }} /></div>
      <div className="lp-loader-count">{String(Math.round(value)).padStart(3, '0')}%</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export function Landing() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const control = React.useRef<FieldControl>({ progress: 0, started: false });
  const pointer = React.useRef<Pointer>({ x: 99, y: 99, isDown: false });
  const [ready, setReady] = React.useState(false);
  const [entered, setEntered] = React.useState(false);
  const [stage, setStage] = React.useState(0);
  const [webglFailed, setWebglFailed] = React.useState(false);

  useSmoothScroll(entered);

  // The 3D field: loaded on the client only, torn down on leave.
  React.useEffect(() => {
    let dispose: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      try {
        const { createField } = await import('./field');
        if (cancelled || !canvasRef.current || !boxRef.current) return;
        dispose = createField({
          canvas: canvasRef.current,
          container: boxRef.current,
          control: control.current,
          pointer: pointer.current,
          onReady: () => setReady(true),
        });
      } catch {
        setWebglFailed(true);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  // Scroll → progress (0 hero, 1 filter, 2 rank, 3 reach) and background stage.
  React.useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const p = window.scrollY / (window.innerHeight || 1);
      control.current.progress = p;
      setStage(p > 1.55 ? 2 : p > 0.7 ? 1 : 0);
      // Once the field has rushed past the camera, fade the canvas so the rest of the page sits on a clean background.
      if (boxRef.current) boxRef.current.style.opacity = String(1 - Math.min(1, Math.max(0, (p - 3.45) / 0.5)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Pointer → normalised device coordinates for the field.
  React.useEffect(() => {
    const p = pointer.current;
    const move = (e: PointerEvent) => {
      p.x = (e.clientX / window.innerWidth) * 2 - 1;
      p.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    const leave = () => {
      p.x = 99;
      p.y = 99;
    };
    const down = () => (p.isDown = true);
    const up = () => (p.isDown = false);
    window.addEventListener('pointermove', move);
    document.addEventListener('pointerleave', leave);
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
    };
  }, []);

  const onDone = React.useCallback(() => {
    control.current.started = true;
    setEntered(true);
  }, []);

  return (
    <div className={`lp${entered ? ' lp-entered' : ''}`}>
      <div className="lp-bg" style={{ background: BG[stage] }} aria-hidden />
      <div className="lp-canvas-box" ref={boxRef} aria-hidden>
        <canvas ref={canvasRef} />
      </div>
      {!entered && <Loader ready={ready} onDone={onDone} />}

      <header className="lp-header">
        <Link href="/" className="lp-wordmark" aria-label="AdScout home">
          <span className="lp-wordmark-mark"><Logo size={20} /></span>
          AdScout
        </Link>
        <nav className="lp-nav" aria-label="Main">
          <Link href="/how-it-works">How it works</Link>
          <Link href="/ads">Ad gallery</Link>
          <Link href="/leads">Leads</Link>
          <Link href="/report">Report</Link>
        </nav>
        <Link href="/dashboard" className="lp-pill pop">
          Open dashboard
          <span className="lp-orb">{Icon.chevron}</span>
        </Link>
      </header>

      {/* 01 Hero: the field floats */}
      <section className="lp-section lp-hero" aria-labelledby="lp-title">
        <div className="lp-hero-row">
          <div className="lp-hero-left">
            <p className="lp-kicker lp-in" style={{ transitionDelay: '0.15s' }}>For agencies and sales teams across India</p>
            <h1 id="lp-title" className="lp-display lp-in" style={{ transitionDelay: '0.28s' }}>
              Your city’s advertisers,
              <br />
              ranked and reachable.
            </h1>
            <div className="lp-hero-cta lp-in" style={{ transitionDelay: '0.4s' }}>
              <Link href="/dashboard" className="lp-btn lp-btn-primary pop">Find advertisers</Link>
              <Link href="/dashboard?demo=1" className="lp-btn lp-btn-ghost pop">See it with sample data</Link>
            </div>
            <div className="lp-cities lp-in" style={{ transitionDelay: '0.5s' }}>
              <span>Works in</span>
              {CITIES.map((c) => (
                <Link key={c.id} href={`/dashboard?demo=1&city=${c.id}`} className="lp-city pop">{c.name}</Link>
              ))}
            </div>
          </div>
          <div className="lp-hero-right lp-in" style={{ transitionDelay: '0.5s' }}>
            <p>
              We read the public Meta Ads Library, keep only businesses based in your city, score how hard their ads are
              working, and hand you their phone numbers.
            </p>
            <span className="lp-scroll-cue">{Icon.arrowDown} Scroll</span>
          </div>
        </div>
      </section>

      {/* 02 Filter: the field falls */}
      <section className="lp-section lp-split" aria-labelledby="lp-filter">
        <div className="lp-split-text">
          <Reveal threshold={0.45}><p className="lp-step"><span>1</span>Filter</p></Reveal>
          <Reveal threshold={0.45} delay={0.1}>
            <h2 id="lp-filter" className="lp-h2">Most ads in a<br />city search aren’t<br />from that city.</h2>
          </Reveal>
          <Reveal threshold={0.45} delay={0.2}>
            <p className="lp-body">
              Search the Ad Library for Pune and you get brands from Delhi, Mumbai and everywhere else. Every advertiser
              is checked for local signals, and the ones without them fall away.
            </p>
          </Reveal>
        </div>
        <Reveal threshold={0.35} delay={0.25} className="lp-cards">
          {[
            { k: 'City name', v: 'Any spelling or script', d: 'Jaipur or जयपुर, Bengaluru or Bangalore, in the ad or the advertiser’s page' },
            { k: 'PIN and phone codes', v: '302xxx and 0141 for Jaipur', d: 'Every supported city has its own PIN prefixes and STD code' },
            { k: 'Local areas', v: `${totalAreas()} neighbourhoods`, d: 'Malviya Nagar, Koramangala, Andheri, Baner, Banjara Hills and more' },
          ].map((c) => (
            <div className="lp-card" key={c.k}>
              <div className="lp-card-inner">
                <span className="lp-card-key">{c.k}</span>
                <b>{c.v}</b>
                <p>{c.d}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* 03 Rank: the field becomes a map pin */}
      <section className="lp-section lp-form" aria-labelledby="lp-rank">
        <div>
          <Reveal threshold={0.45}><p className="lp-step"><span>2</span>Rank</p></Reveal>
          <Reveal threshold={0.45} delay={0.1}>
            <h2 id="lp-rank" className="lp-h2">What’s left<br />is local.</h2>
          </Reveal>
        </div>
        <div className="lp-form-bottom">
          <Reveal threshold={0.45} delay={0.15}>
            <p className="lp-body">
              Each local advertiser gets a score out of 100 from four public signals: ads live now, how long they have run,
              platforms used, and new ads this month. Ads that keep running are usually ads that pay.
            </p>
          </Reveal>
          <Reveal threshold={0.45} delay={0.28}>
            <span className="lp-chip">{Icon.pointer} Move your cursor through it</span>
          </Reveal>
        </div>
      </section>

      {/* 04 Reach: the field rushes past */}
      <section className="lp-section lp-release" aria-labelledby="lp-reach">
        <Reveal threshold={0.45}><p className="lp-step"><span>3</span>Reach</p></Reveal>
        <Reveal threshold={0.45} delay={0.12}>
          <h2 id="lp-reach" className="lp-h2 lp-h2-xl">Then, the people<br />to call.</h2>
        </Reveal>
        <Reveal threshold={0.45} delay={0.24}>
          <p className="lp-body lp-center">
            Phone, WhatsApp, email and website for each company, taken from its ads and its own site. Save the ones you
            want and track every conversation.
          </p>
        </Reveal>
        <Reveal threshold={0.45} delay={0.34}>
          <Link href="/dashboard" className="lp-btn lp-btn-primary pop">Open the dashboard</Link>
        </Reveal>
      </section>

      {/* What's inside */}
      <section className="lp-inside" aria-labelledby="lp-inside">
        <Reveal className="lp-inside-head">
          <h2 id="lp-inside" className="lp-h2">Inside the dashboard</h2>
          <p className="lp-body">Five tools that turn a list of ads into a sales pipeline.</p>
        </Reveal>
        <ul className="lp-feature-list">
          {FEATURES.map((f, i) => (
            <Reveal as="li" key={f.href} delay={i * 0.06} threshold={0.3}>
              <Link href={f.href} className="lp-feature">
                <span className="lp-feature-title">{f.title}</span>
                <span className="lp-feature-body">{f.body}</span>
                <span className="lp-feature-go">{Icon.arrowUpRight}</span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      <footer className="lp-footer">
        <div className="lp-marquee" aria-hidden>
          <div className="lp-marquee-track">
            {[0, 1].map((k) => (
              <React.Fragment key={k}>
                {['Find', 'Rank', 'Reach', 'Local', 'Find', 'Rank', 'Reach', 'Local'].map((w, i) => (
                  <span key={`${k}-${i}`} className="lp-marquee-word">{w}<i /></span>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="lp-footer-body">
          <Reveal className="lp-footer-cta">
            <h2>Your next client is<br />already running ads.</h2>
            <Link href="/dashboard" className="lp-mail pop">
              Open the dashboard
              <span className="lp-orb lp-orb-lg">{Icon.arrowUpRight}</span>
            </Link>
          </Reveal>
          <div className="lp-footer-cols">
            {[
              { t: 'Product', l: [['Dashboard', '/dashboard'], ['Lead tracker', '/leads'], ['Ad gallery', '/ads'], ['History', '/history'], ['Report', '/report']] },
              { t: 'Learn', l: [['How it works', '/how-it-works'], ['Meta Ads Library', 'https://www.facebook.com/ads/library/'], ['Google Ads Transparency', 'https://adstransparency.google.com/?region=IN']] },
            ].map((col, i) => (
              <Reveal key={col.t} delay={i * 0.08}>
                <span className="lp-col-title">{col.t}</span>
                <ul>
                  {col.l.map(([label, href]) => (
                    <li key={label}>
                      {href.startsWith('http') ? (
                        <a href={href} target="_blank" rel="noreferrer">{label}{Icon.arrowUpRight}</a>
                      ) : (
                        <Link href={href}>{label}{Icon.arrowUpRight}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
        <div className="lp-footer-bar">
          <span className="lp-wordmark lp-wordmark-sm"><Logo size={16} /> AdScout</span>
          <span>Built on public ad data. Scores are estimates, not spend.</span>
        </div>
      </footer>

      {webglFailed && <p className="lp-nogl">3D view needs WebGL. Everything else works normally.</p>}
    </div>
  );
}
