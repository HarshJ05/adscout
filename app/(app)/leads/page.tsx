import type { Metadata } from 'next';
import { LeadsView } from '@/components/LeadsView';

export const metadata: Metadata = { title: 'Lead tracker' };

export default function LeadsPage() {
  return <LeadsView />;
}
