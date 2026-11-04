import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Jaipur Ad Finder — find Jaipur businesses that advertise', template: '%s · Jaipur Ad Finder' },
  description:
    'Search the Meta Ads Library for Jaipur businesses, rank the best-performing advertisers, and collect their phone numbers, emails and websites.',
  applicationName: 'Jaipur Ad Finder',
  keywords: ['Jaipur', 'Meta Ads Library', 'Facebook ads', 'Instagram ads', 'lead generation', 'local businesses'],
  openGraph: {
    type: 'website',
    title: 'Jaipur Ad Finder',
    description: 'Find Jaipur businesses that advertise on Facebook & Instagram — and see who does it best.',
    siteName: 'Jaipur Ad Finder',
  },
  twitter: { card: 'summary_large_image', title: 'Jaipur Ad Finder' },
  robots: { index: false, follow: false }, // internal tool: keep it out of search engines
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0f6cbd' },
    { media: '(prefers-color-scheme: dark)', color: '#1b1a19' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <a href="#main" className="skip-link">Skip to content</a>
          <AppHeader />
          <main id="main" className="page">{children}</main>
          <AppFooter />
        </Providers>
      </body>
    </html>
  );
}
