'use client';

import { createLocalStore } from './store';
import type { ScanResult } from './types';
import type { LeadMap } from './leads';
import { DEFAULT_TEMPLATE } from './leads';
import type { Snapshot } from './history';

/** Every page reads the same stores, so the dashboard, leads, ads, history and report always agree. */
export const resultStore = createLocalStore<ScanResult | null>('adscout:last-result:v2', null);
export const historyStore = createLocalStore<Snapshot[]>('jaf:history:v1', []);
export const leadStore = createLocalStore<LeadMap>('jaf:leads:v1', {});
export const templateStore = createLocalStore<string>('jaf:template:v1', DEFAULT_TEMPLATE);
/** The city being searched. Every page uses it. */
export const cityStore = createLocalStore<string>('adscout:city:v1', 'jaipur');
