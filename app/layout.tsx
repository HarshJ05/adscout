import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import { AppHeader } from '@/components/AppHeader';

export const metadata: Metadata = {
  title: 'Jaipur Ad Finder',
  description: 'Find Jaipur businesses advertising on Facebook and Instagram, see who performs best, and get their contact details.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0f6cbd' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppHeader />
          <main className="page">{children}</main>
          <footer className="footer">
            Data source: public Meta Ads Library (facebook.com/ads/library). Scores are estimates from public ad signals.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
