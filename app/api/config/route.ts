import { NextResponse } from 'next/server';
import { apifyToken } from '@/lib/apify';

export const dynamic = 'force-dynamic';

/** Tells the page whether live scanning is set up (an Apify token exists). */
export async function GET() {
  return NextResponse.json({ live: Boolean(apifyToken()) });
}
