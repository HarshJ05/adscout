import type { Metadata } from 'next';
import { AdGallery } from '@/components/AdGallery';

export const metadata: Metadata = { title: 'Ad gallery' };

export default function AdsPage() {
  return <AdGallery />;
}
