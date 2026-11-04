/**
 * Business types the user can pick. Each has the search words sent to the
 * Meta Ads Library (always combined with "Jaipur") and the keywords used to
 * label an advertiser with that type.
 */
export interface Category {
  id: string;
  label: string;
  search: string[]; // extra words added to the "jaipur" search
  keywords: string[]; // words that classify an advertiser into this category
}

export const CATEGORIES: Category[] = [
  {
    id: 'real-estate',
    label: 'Real estate',
    search: ['property', 'flats', 'plots'],
    keywords: ['property', 'flat', 'flats', 'plot', 'plots', 'villa', 'bhk', 'apartment', 'real estate', 'jda approved', 'rera', 'township', 'builder', 'residency', 'farmhouse'],
  },
  {
    id: 'education',
    label: 'Education & coaching',
    search: ['coaching', 'school', 'admission'],
    keywords: ['coaching', 'classes', 'academy', 'institute', 'admission', 'school', 'college', 'neet', 'jee', 'ias', 'ras', 'tuition', 'course', 'university', 'batch', 'exam'],
  },
  {
    id: 'healthcare',
    label: 'Clinics & hospitals',
    search: ['clinic', 'hospital', 'doctor'],
    keywords: ['clinic', 'hospital', 'doctor', 'dr.', 'dental', 'skin', 'ivf', 'physiotherapy', 'eye', 'hair transplant', 'ayurved', 'health', 'surgery', 'diagnostic', 'pathology'],
  },
  {
    id: 'food',
    label: 'Restaurants & cafes',
    search: ['restaurant', 'cafe'],
    keywords: ['restaurant', 'cafe', 'café', 'food', 'dine', 'buffet', 'thali', 'pizza', 'bakery', 'cake', 'kitchen', 'dhaba', 'rooftop', 'sweets'],
  },
  {
    id: 'fashion',
    label: 'Fashion & jewellery',
    search: ['jewellery', 'saree', 'boutique'],
    keywords: ['jewellery', 'jewelry', 'saree', 'lehenga', 'boutique', 'kurti', 'fashion', 'gems', 'silver', 'gold', 'kundan', 'ethnic', 'bridal', 'wear', 'textile', 'block print'],
  },
  {
    id: 'beauty',
    label: 'Salons & fitness',
    search: ['salon', 'gym'],
    keywords: ['salon', 'spa', 'makeup', 'bridal makeup', 'parlour', 'gym', 'fitness', 'yoga', 'nail', 'beauty', 'unisex'],
  },
  {
    id: 'home',
    label: 'Furniture & interiors',
    search: ['furniture', 'interior'],
    keywords: ['furniture', 'interior', 'modular', 'kitchen', 'sofa', 'decor', 'marble', 'tiles', 'wardrobe', 'home decor'],
  },
  {
    id: 'travel',
    label: 'Travel & hotels',
    search: ['hotel', 'tour', 'wedding venue'],
    keywords: ['hotel', 'resort', 'tour', 'travel', 'taxi', 'cab', 'holiday', 'package', 'banquet', 'wedding venue', 'stay', 'heritage'],
  },
  {
    id: 'auto',
    label: 'Cars & bikes',
    search: ['car', 'showroom'],
    keywords: ['car', 'cars', 'bike', 'showroom', 'motors', 'automobile', 'ev', 'scooter', 'test drive', 'service center'],
  },
];

export const OTHER_CATEGORY = 'Other services';

export function classify(text: string, pageCategories: string[]): string {
  const hay = (text + ' ' + pageCategories.join(' ')).toLowerCase();
  let best = OTHER_CATEGORY;
  let bestHits = 0;
  for (const c of CATEGORIES) {
    let hits = 0;
    for (const k of c.keywords) {
      if (new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:s|es)?\\b`, 'i').test(hay)) hits++;
    }
    if (hits > bestHits) {
      bestHits = hits;
      best = c.label;
    }
  }
  return best;
}

/** Search words for the Ad Library. Every search includes "jaipur". */
export function searchTermsFor(categoryIds: string[]): string[] {
  const picked = CATEGORIES.filter((c) => categoryIds.includes(c.id));
  if (picked.length === 0) return ['jaipur'];
  const terms = new Set<string>();
  for (const c of picked) for (const s of c.search) terms.add(`jaipur ${s}`);
  return Array.from(terms);
}
