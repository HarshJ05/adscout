'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Megaphone24Regular } from '@fluentui/react-icons';

export function AppHeader() {
  const path = usePathname();
  return (
    <header className="app-bar">
      <Link href="/" className="brand" aria-label="Jaipur Ad Finder home">
        <span className="brand-mark"><Megaphone24Regular /></span>
        <span className="brand-text">Jaipur Ad Finder</span>
      </Link>
      <nav className="app-nav" aria-label="Main">
        <Link href="/" className={path === '/' ? 'active' : ''}>Dashboard</Link>
        <Link href="/how-it-works" className={path === '/how-it-works' ? 'active' : ''}>How it works</Link>
      </nav>
      <div className="app-bar-spacer" />
    </header>
  );
}
