export interface Ad {
  id: string;
  pageId: string;
  pageName: string;
  pageUrl: string | null;
  avatarUrl: string | null;
  text: string;
  title: string | null;
  cta: string | null;
  linkUrl: string | null;
  imageUrl: string | null;
  platforms: string[];
  startDate: string | null; // ISO date (YYYY-MM-DD)
  endDate: string | null;
  isActive: boolean;
  daysRunning: number;
  variations: number;
  libraryUrl: string;
  pageCategories: string[];
  /** Extra text from the advertiser's "About" page, when the scraper returns it */
  aboutText: string;
}

export interface Contacts {
  phones: string[];
  emails: string[];
  whatsapp: string[];
  websites: string[];
  instagram: string[];
  address: string | null;
}

export type JaipurLevel = 'High' | 'Medium' | 'Low';

export interface JaipurCheck {
  points: number;
  level: JaipurLevel;
  signals: string[];
}

export interface ScoreParts {
  activity: number; // 0-35  active ads
  longevity: number; // 0-30 how long ads keep running
  reach: number; // 0-15 platforms used
  freshness: number; // 0-20 new ads in the last 30 days
}

export type Tier = 'Top performer' | 'Strong' | 'Moderate' | 'Getting started';

export interface Company {
  id: string;
  name: string;
  pageUrl: string | null;
  avatarUrl: string | null;
  category: string;
  jaipur: JaipurCheck;
  ads: Ad[];
  activeAds: number;
  totalAds: number;
  longestRunningDays: number;
  newAds30d: number;
  platforms: string[];
  firstSeen: string | null;
  score: number;
  scoreParts: ScoreParts;
  tier: Tier;
  contacts: Contacts;
  metaLibraryUrl: string;
  googleAdsUrl: string;
  enriched: boolean;
}

export interface ScanResult {
  mode: 'live' | 'demo';
  scannedAt: string;
  adsChecked: number;
  companies: Company[];
  rejected: number; // advertisers dropped because no Jaipur signal was found
}
