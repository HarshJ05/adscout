'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button, Tooltip } from '@fluentui/react-components';
import { Megaphone24Regular, WeatherMoon20Regular, WeatherSunny20Regular } from '@fluentui/react-icons';
import { useThemeMode } from '@/app/providers';

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/how-it-works', label: 'How it works' },
];

export function AppHeader() {
  const path = usePathname();
  const { mode, toggle } = useThemeMode();
  return (
    <header className="app-bar">
      <Link href="/" className="brand" aria-label="Jaipur Ad Finder home">
        <span className="brand-mark"><Megaphone24Regular /></span>
        <span className="brand-text">Jaipur Ad Finder</span>
      </Link>
      <nav className="app-nav" aria-label="Main">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={path === n.href ? 'active' : ''} aria-current={path === n.href ? 'page' : undefined}>
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="app-bar-spacer" />
      <Tooltip content={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} relationship="label">
        <Button
          appearance="transparent"
          className="bar-icon-btn"
          icon={mode === 'dark' ? <WeatherSunny20Regular /> : <WeatherMoon20Regular />}
          onClick={toggle}
        />
      </Tooltip>
    </header>
  );
}
