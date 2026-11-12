import type { Ad, ScanResult } from './types';
import { buildCompanies } from './aggregate';
import { DEFAULT_CITY, CITIES, type City } from './cities';

/**
 * SAMPLE DATA for Demo mode. Every business, number and address here is
 * fictional: phone numbers use the invalid "+91 00000" range and websites use
 * the reserved ".example" domain, so nothing can be mistaken for a real company.
 * The sample ads run through exactly the same pipeline as live data
 * (Jaipur check → grouping → scoring), so the demo shows the real logic.
 */

interface Seed {
  name: string;
  slug: string;
  /** Index into the city's area list, so every city gets its own neighbourhoods */
  areaIdx: number;
  ads: number;
  maxDays: number;
  fresh: number;
  platforms: string[];
  /** Ad lines; {city} and {area} are filled in */
  lines: string[];
  cta: string;
}

const SEEDS: Seed[] = [
  { name: 'Skyline Homes', slug: 'skylinehomes', areaIdx: 5, ads: 14, maxDays: 210, fresh: 5, platforms: ['Facebook', 'Instagram', 'Messenger'], cta: 'Learn more', lines: ['Approved plots near {area} main road. Easy EMI, possession in 2026.', '2 & 3 BHK flats in {area}, {city}. Site visit this Sunday!'] },
  { name: 'Brightpath Coaching Academy', slug: 'brightpath', areaIdx: 20, ads: 11, maxDays: 160, fresh: 6, platforms: ['Facebook', 'Instagram'], cta: 'Sign up', lines: ['NEET & JEE 2027 batch admissions open in {city}. Free demo class.', 'Foundation course for Class 9 and 10 in {area}, {city}. Limited seats.'] },
  { name: 'Smile Studio Dental', slug: 'smilestudio', areaIdx: 1, ads: 7, maxDays: 240, fresh: 2, platforms: ['Facebook', 'Instagram', 'Messenger'], cta: 'Book now', lines: ['Painless root canal and smile makeover in {area}, {city}.', 'Free dental check-up this month. Book on WhatsApp.'] },
  { name: 'Heritage Gems & Kundan', slug: 'heritagegems', areaIdx: 25, ads: 9, maxDays: 120, fresh: 4, platforms: ['Facebook', 'Instagram'], cta: 'Shop now', lines: ['Bridal kundan sets handcrafted for {city} weddings. Visit us in {area}.', 'Silver jewellery festive offer, up to 30% off.'] },
  { name: 'Rooftop Rasoi Cafe', slug: 'rooftoprasoi', areaIdx: 3, ads: 5, maxDays: 90, fresh: 3, platforms: ['Instagram', 'Facebook'], cta: 'Get directions', lines: ['Sunset dinners with a view of {city}. Find us in {area}.', 'Unlimited thali every weekend.'] },
  { name: 'Pulse Fitness Hub', slug: 'pulsefitness', areaIdx: 2, ads: 4, maxDays: 70, fresh: 2, platforms: ['Instagram'], cta: 'Sign up', lines: ['Join the biggest unisex gym in {area}, {city}. First month free.'] },
  { name: 'Woodcraft Interiors', slug: 'woodcraft', areaIdx: 0, ads: 6, maxDays: 180, fresh: 1, platforms: ['Facebook', 'Instagram'], cta: 'Get quote', lines: ['Modular kitchens and wardrobes in {area}, {city}. Free 3D design.'] },
  { name: 'Grand Haveli Stays', slug: 'grandhaveli', areaIdx: 43, ads: 8, maxDays: 300, fresh: 2, platforms: ['Facebook', 'Instagram', 'Audience Network'], cta: 'Book now', lines: ['Boutique stay and wedding venue in {area}, {city}.', 'Weekend getaway packages in {city}.'] },
  { name: 'Handblock Prints Co.', slug: 'handblock', areaIdx: 10, ads: 6, maxDays: 45, fresh: 5, platforms: ['Instagram', 'Facebook'], cta: 'Shop now', lines: ['Hand block printed kurtis and sarees, straight from our {area} studio in {city}.'] },
  { name: 'Metro EV Motors', slug: 'metroev', areaIdx: 6, ads: 5, maxDays: 130, fresh: 1, platforms: ['Facebook'], cta: 'Book test drive', lines: ['New EV showroom in {area}, {city}. Book a test drive today.'] },
  { name: 'ClearSkin Clinic', slug: 'clearskin', areaIdx: 4, ads: 4, maxDays: 200, fresh: 0, platforms: ['Facebook', 'Instagram'], cta: 'Book now', lines: ['Laser hair removal and skin care by certified doctors, {area}, {city}.'] },
  { name: 'Sunrise Public School', slug: 'sunriseschool', areaIdx: 19, ads: 3, maxDays: 60, fresh: 3, platforms: ['Facebook'], cta: 'Learn more', lines: ['Admissions open 2027–28, Nursery to Class 9. {area}, {city}.'] },
  { name: 'Greenfield Township', slug: 'greenfield', areaIdx: 7, ads: 3, maxDays: 25, fresh: 3, platforms: ['Facebook', 'Instagram'], cta: 'Learn more', lines: ['Gated township plots near {area}, {city}. Pre-launch prices.'] },
  { name: 'Butter & Crumb Bakehouse', slug: 'buttercrumb', areaIdx: 11, ads: 2, maxDays: 35, fresh: 1, platforms: ['Instagram'], cta: 'Order now', lines: ['Custom birthday cakes delivered across {city} in 3 hours.'] },
  { name: 'Glow Bridal Studio', slug: 'glowbridal', areaIdx: 18, ads: 5, maxDays: 110, fresh: 2, platforms: ['Instagram', 'Facebook'], cta: 'Book now', lines: ['HD bridal makeup packages in {area}, {city}. Book for wedding season.'] },
  { name: 'Motion Physio Care', slug: 'motionphysio', areaIdx: 30, ads: 2, maxDays: 15, fresh: 2, platforms: ['Facebook'], cta: 'Call now', lines: ['Back and knee pain physiotherapy at home across {area}, {city}.'] },
  { name: 'Oakline Furniture Mart', slug: 'oakline', areaIdx: 9, ads: 3, maxDays: 75, fresh: 0, platforms: ['Facebook'], cta: 'Shop now', lines: ['Sofa sets and beds at factory prices in {area}, {city}.'] },
  { name: 'CityWheels Cabs', slug: 'citywheels', areaIdx: 15, ads: 2, maxDays: 50, fresh: 1, platforms: ['Facebook', 'Instagram'], cta: 'Call now', lines: ['{city} sightseeing taxi and outstation cabs, 24×7 from {area}.'] },
  { name: 'ClearVision Eye Centre', slug: 'clearvision', areaIdx: 13, ads: 1, maxDays: 95, fresh: 0, platforms: ['Facebook'], cta: 'Book now', lines: ['LASIK and cataract surgery consults in {area}, {city}.'] },
  { name: 'Topper Tuition Point', slug: 'toppertuition', areaIdx: 27, ads: 1, maxDays: 8, fresh: 1, platforms: ['Facebook'], cta: 'Send message', lines: ['Class 10 and 12 board tuition in {area}, {city}. Small batches.'] },
  { name: 'Gadget Galaxy Electronics', slug: 'gadgetgalaxy', areaIdx: 0, ads: 2, maxDays: 20, fresh: 2, platforms: ['Instagram'], cta: 'Shop now', lines: ['Diwali offers on phones and laptops near {area}, {city}.'] },
  { name: 'Prana Yoga Shala', slug: 'pranayoga', areaIdx: 34, ads: 1, maxDays: 40, fresh: 0, platforms: ['Instagram'], cta: 'Sign up', lines: ['Morning yoga batches in {area}, {city}.'] },
];

// Small deterministic random number generator, so the demo looks the same on every load.
function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

export function demoResult(today = new Date(), city: City = DEFAULT_CITY): ScanResult {
  const areas = Object.keys(city.areas);
  const areaOf = (s: Seed) => areas[s.areaIdx % areas.length];
  const pinOf = (s: Seed) => `${city.pinPrefixes[0]}${String((s.areaIdx * 7) % 90 + 1).padStart(3, '0')}`;
  const fill = (line: string, s: Seed) => line.replaceAll('{city}', city.name).replaceAll('{area}', areaOf(s));
  const rand = rng(42);
  const ads: Ad[] = [];
  SEEDS.forEach((seed, si) => {
    const pageId = `demo-${seed.slug}`;
    for (let i = 0; i < seed.ads; i++) {
      // The first `fresh` ads started in the last 30 days, the first older ad ran `maxDays`.
      const days = i < seed.fresh ? 1 + Math.floor(rand() * 28) : i === seed.fresh ? seed.maxDays : 30 + Math.floor(rand() * Math.max(1, seed.maxDays - 30));
      const start = new Date(today.getTime() - days * 864e5).toISOString().slice(0, 10);
      const line = fill(seed.lines[i % seed.lines.length], seed);
      ads.push({
        id: `${pageId}-${i}`,
        pageId,
        pageName: seed.name,
        pageUrl: null,
        avatarUrl: null,
        text: `${line}\n📍 ${areaOf(seed)}, ${city.name} ${pinOf(seed)}`,
        title: seed.name,
        cta: seed.cta,
        linkUrl: `https://${seed.slug}.example/`,
        imageUrl: null,
        platforms: seed.platforms,
        startDate: start,
        endDate: null,
        isActive: true,
        daysRunning: days,
        variations: 1,
        libraryUrl: 'https://www.facebook.com/ads/library/',
        pageCategories: [],
        aboutText: '',
      });
    }
    // One stopped ad for some advertisers, to show history.
    if (si % 3 === 0) {
      ads.push({ ...ads[ads.length - 1], id: `${pageId}-old`, isActive: false, daysRunning: 20, endDate: new Date(today.getTime() - 40 * 864e5).toISOString().slice(0, 10), startDate: new Date(today.getTime() - 60 * 864e5).toISOString().slice(0, 10) });
    }
  });

  // An advertiser from another city: the pipeline should drop it.
  const other = CITIES.find((c) => c.id !== city.id)!;
  const otherArea = Object.keys(other.areas)[0];
  ads.push({ ...ads[0], id: 'demo-other-0', pageId: 'demo-other', pageName: `${other.name} Luxury Realty`, title: null, text: `Luxury flats in ${otherArea}, ${other.name}.`, linkUrl: null });

  const result = buildCompanies(ads, 'demo', today, city);
  result.companies.forEach((c, i) => {
    const seed = SEEDS.find((s) => `demo-${s.slug}` === c.id);
    if (!seed) return;
    const n = String(101 + i).padStart(5, '0');
    c.pageUrl = null;
    c.metaLibraryUrl = 'https://www.facebook.com/ads/library/';
    c.contacts = {
      phones: i % 5 === 4 ? [] : [`+91 00000 ${n}`],
      emails: i % 3 === 2 ? [] : [`hello@${seed.slug}.example`],
      whatsapp: i % 2 === 0 ? [`+91 00000 ${n}`] : [],
      websites: [`https://${seed.slug}.example`],
      instagram: seed.platforms.includes('Instagram') ? [`@${seed.slug}`] : [],
      address: `${areaOf(seed)}, ${city.name} ${pinOf(seed)}`,
    };
    c.enriched = true;
  });
  return result;
}
