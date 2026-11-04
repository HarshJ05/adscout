import type { Ad, ScanResult } from './types';
import { buildCompanies } from './aggregate';

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
  area: string;
  pin: string;
  ads: number;
  maxDays: number;
  fresh: number;
  platforms: string[];
  lines: string[];
  cta: string;
}

const SEEDS: Seed[] = [
  { name: 'Pink City Homes', slug: 'pinkcityhomes', area: 'Jagatpura', pin: '302017', ads: 14, maxDays: 210, fresh: 5, platforms: ['Facebook', 'Instagram', 'Messenger'], cta: 'Learn more', lines: ['JDA approved plots on Jagatpura main road — easy EMI, possession in 2026.', '2 & 3 BHK flats near the airport, Jaipur. Site visit this Sunday!'] },
  { name: 'Aravali Coaching Academy', slug: 'aravalicoaching', area: 'Gopalpura', pin: '302018', ads: 11, maxDays: 160, fresh: 6, platforms: ['Facebook', 'Instagram'], cta: 'Sign up', lines: ['NEET & JEE 2027 batch admissions open in Jaipur. Free demo class.', 'RAS foundation course — Gopalpura bypass, Jaipur. Limited seats.'] },
  { name: 'Hawa Smile Dental Studio', slug: 'hawasmile', area: 'Vaishali Nagar', pin: '302021', ads: 7, maxDays: 240, fresh: 2, platforms: ['Facebook', 'Instagram', 'Messenger'], cta: 'Book now', lines: ['Painless root canal & smile makeover in Vaishali Nagar, Jaipur.', 'Free dental check-up this month. Book on WhatsApp.'] },
  { name: 'Johari Gems & Kundan', slug: 'joharigems', area: 'Johari Bazaar', pin: '302003', ads: 9, maxDays: 120, fresh: 4, platforms: ['Facebook', 'Instagram'], cta: 'Shop now', lines: ['Bridal kundan sets handcrafted in Johari Bazaar, Jaipur.', 'Silver jewellery festive offer — up to 30% off.'] },
  { name: 'Rooftop Rasoi Cafe', slug: 'rooftoprasoi', area: 'C-Scheme', pin: '302001', ads: 5, maxDays: 90, fresh: 3, platforms: ['Instagram', 'Facebook'], cta: 'Get directions', lines: ['Sunset dinners with a view of the Pink City. C-Scheme, Jaipur.', 'Unlimited Rajasthani thali every weekend.'] },
  { name: 'Mansarovar Fitness Hub', slug: 'mansarovarfit', area: 'Mansarovar', pin: '302020', ads: 4, maxDays: 70, fresh: 2, platforms: ['Instagram'], cta: 'Sign up', lines: ['Join Jaipur’s biggest unisex gym in Mansarovar — 1 month free.'] },
  { name: 'Blue Pottery Interiors', slug: 'bluepottery', area: 'Malviya Nagar', pin: '302017', ads: 6, maxDays: 180, fresh: 1, platforms: ['Facebook', 'Instagram'], cta: 'Get quote', lines: ['Modular kitchens & wardrobes in Malviya Nagar, Jaipur. Free 3D design.'] },
  { name: 'Amber Heritage Stays', slug: 'amberheritage', area: 'Amer Road', pin: '302002', ads: 8, maxDays: 300, fresh: 2, platforms: ['Facebook', 'Instagram', 'Audience Network'], cta: 'Book now', lines: ['Heritage haveli stay on Amer Road, Jaipur — wedding venue & banquet.', 'Weekend getaway packages in the Pink City.'] },
  { name: 'Sanganer Block Prints', slug: 'sanganerprints', area: 'Sanganer', pin: '302029', ads: 6, maxDays: 45, fresh: 5, platforms: ['Instagram', 'Facebook'], cta: 'Shop now', lines: ['Hand block printed kurtis & sarees direct from Sanganer, Jaipur.'] },
  { name: 'Tonk Road Motors', slug: 'tonkroadmotors', area: 'Tonk Road', pin: '302015', ads: 5, maxDays: 130, fresh: 1, platforms: ['Facebook'], cta: 'Book test drive', lines: ['New EV showroom on Tonk Road, Jaipur — book a test drive today.'] },
  { name: 'Raja Park Skin Clinic', slug: 'rajaparkskin', area: 'Raja Park', pin: '302004', ads: 4, maxDays: 200, fresh: 0, platforms: ['Facebook', 'Instagram'], cta: 'Book now', lines: ['Laser hair removal & skin care by certified doctors, Raja Park, Jaipur.'] },
  { name: 'Vidhyadhar Nagar Public School', slug: 'vnpschool', area: 'Vidhyadhar Nagar', pin: '302039', ads: 3, maxDays: 60, fresh: 3, platforms: ['Facebook'], cta: 'Learn more', lines: ['Admissions open 2027–28, Nursery to Class 9. Vidhyadhar Nagar, Jaipur.'] },
  { name: 'Ajmer Road Township', slug: 'ajmerroadtownship', area: 'Ajmer Road', pin: '302026', ads: 3, maxDays: 25, fresh: 3, platforms: ['Facebook', 'Instagram'], cta: 'Learn more', lines: ['Gated township plots on Ajmer Road, Jaipur. Pre-launch prices.'] },
  { name: 'Bani Park Bakehouse', slug: 'baniparkbake', area: 'Bani Park', pin: '302016', ads: 2, maxDays: 35, fresh: 1, platforms: ['Instagram'], cta: 'Order now', lines: ['Custom birthday cakes delivered across Jaipur in 3 hours.'] },
  { name: 'Glow Bridal Studio', slug: 'glowbridal', area: 'Nirman Nagar', pin: '302019', ads: 5, maxDays: 110, fresh: 2, platforms: ['Instagram', 'Facebook'], cta: 'Book now', lines: ['HD bridal makeup packages — Nirman Nagar, Jaipur. Book for wedding season.'] },
  { name: 'Sitapura Physio Care', slug: 'sitapuraphysio', area: 'Sitapura', pin: '302022', ads: 2, maxDays: 15, fresh: 2, platforms: ['Facebook'], cta: 'Call now', lines: ['Back & knee pain physiotherapy at home, Sitapura & Jagatpura, Jaipur.'] },
  { name: 'Jhotwara Furniture Mart', slug: 'jhotwarafurniture', area: 'Jhotwara', pin: '302012', ads: 3, maxDays: 75, fresh: 0, platforms: ['Facebook'], cta: 'Shop now', lines: ['Sofa sets & beds at factory prices — Jhotwara, Jaipur.'] },
  { name: 'Pink Wheels Cab Service', slug: 'pinkwheels', area: 'Durgapura', pin: '302018', ads: 2, maxDays: 50, fresh: 1, platforms: ['Facebook', 'Instagram'], cta: 'Call now', lines: ['Jaipur sightseeing taxi & outstation cabs, 24×7 from Durgapura.'] },
  { name: 'Civil Lines Eye Centre', slug: 'civillineseye', area: 'Civil Lines', pin: '302006', ads: 1, maxDays: 95, fresh: 0, platforms: ['Facebook'], cta: 'Book now', lines: ['LASIK & cataract surgery consults at Civil Lines, Jaipur.'] },
  { name: 'Murlipura Tuition Point', slug: 'murlipuratuition', area: 'Murlipura', pin: '302039', ads: 1, maxDays: 8, fresh: 1, platforms: ['Facebook'], cta: 'Send message', lines: ['Class 10 & 12 board tuition, Murlipura, Jaipur. Small batches.'] },
  { name: 'Gaurav Tower Electronics', slug: 'gauravelectronics', area: 'Gaurav Tower', pin: '302017', ads: 2, maxDays: 20, fresh: 2, platforms: ['Instagram'], cta: 'Shop now', lines: ['Diwali offers on phones & laptops near Gaurav Tower, Malviya Nagar, Jaipur.'] },
  { name: 'Chitrakoot Yoga Shala', slug: 'chitrakootyoga', area: 'Chitrakoot', pin: '302021', ads: 1, maxDays: 40, fresh: 0, platforms: ['Instagram'], cta: 'Sign up', lines: ['Morning yoga batches in Chitrakoot, Vaishali Nagar, Jaipur.'] },
];

// Small deterministic random number generator, so the demo looks the same on every load.
function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

export function demoResult(today = new Date()): ScanResult {
  const rand = rng(42);
  const ads: Ad[] = [];
  SEEDS.forEach((seed, si) => {
    const pageId = `demo-${seed.slug}`;
    for (let i = 0; i < seed.ads; i++) {
      // The first `fresh` ads started in the last 30 days, the first older ad ran `maxDays`.
      const days = i < seed.fresh ? 1 + Math.floor(rand() * 28) : i === seed.fresh ? seed.maxDays : 30 + Math.floor(rand() * Math.max(1, seed.maxDays - 30));
      const start = new Date(today.getTime() - days * 864e5).toISOString().slice(0, 10);
      const line = seed.lines[i % seed.lines.length];
      ads.push({
        id: `${pageId}-${i}`,
        pageId,
        pageName: seed.name,
        pageUrl: null,
        avatarUrl: null,
        text: `${line}\n📍 ${seed.area}, Jaipur ${seed.pin}`,
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

  // An advertiser with no Jaipur signal — the pipeline should drop it.
  ads.push({ ...ads[0], id: 'demo-delhi-0', pageId: 'demo-delhi', pageName: 'Capital Realty Delhi', title: null, text: 'Luxury flats in Dwarka, New Delhi.', linkUrl: null });

  const result = buildCompanies(ads, 'demo', today);
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
      address: `${seed.area}, Jaipur, Rajasthan ${seed.pin}`,
    };
    c.enriched = true;
  });
  return result;
}
