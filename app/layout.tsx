import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/manrope';
import './globals.css';
import { Providers } from './providers';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'AdScout: local businesses that advertise, ranked', template: '%s · AdScout' },
  description:
    'Search the Meta Ads Library for businesses in Jaipur, Delhi, Mumbai, Bengaluru, Pune, Hyderabad or Ahmedabad, rank them by how hard their ads are working, and get their phone numbers, emails and websites.',
  applicationName: 'AdScout',
  openGraph: {
    type: 'website',
    title: 'AdScout',
    description: 'Every local business that advertises on Facebook and Instagram in your city, ranked, with contact details.',
    siteName: 'AdScout',
  },
  twitter: { card: 'summary_large_image', title: 'AdScout' },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#050706', colorScheme: 'dark' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
