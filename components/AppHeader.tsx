'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { CityPicker } from './CityPicker';
import { useLocalStore } from '@/lib/store';
import { leadStore } from '@/lib/stores';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/leads', label: 'Leads' },
  { href: '/ads', label: 'Ad gallery' },
  { href: '/history', label: 'History' },
  { href: '/report', label: 'Report' },
  { href: '/how-it-works', label: 'How it works' },
];

export function AppHeader() {
  const path = usePathname();
  const leads = useLocalStore(leadStore);
  const open = Object.values(leads).filter((l) => l.status === 'new' || l.status === 'contacted' || l.status === 'interested').length;
  return (
    <header className="app-bar">
      <Link href="/" className="brand" aria-label="AdScout home">
        <span className="brand-mark"><Logo /></span>
        <span className="brand-text">AdScout</span>
      </Link>
      <nav className="app-nav" aria-label="Main">
        {NAV.map((n) => {
          const active = path === n.href;
          return (
            <Link key={n.href} href={n.href} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>
              {n.label}
              {n.href === '/leads' && open > 0 && <span className="nav-count">{open}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="app-bar-city"><CityPicker compact /></div>
    </header>
  );
}
