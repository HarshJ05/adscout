import Link from 'next/link';
import { WEIGHTS, CAPS } from '@/lib/scoring';
import { CITIES, totalAreas } from '@/lib/cities';

export const metadata = { title: 'How it works' };

const STEPS = [
  { n: 1, t: 'Search ads', d: 'We search the public Meta Ads Library (India, active ads) for words like “Pune property” or “Delhi coaching”.' },
  { n: 2, t: 'Keep it local', d: 'Each advertiser is checked for signs of your city: its name, local areas, PIN codes and the landline code.' },
  { n: 3, t: 'Rank the best', d: 'Every company gets a Performance Score from 0 to 100 based on its ads. Higher means stronger advertising.' },
  { n: 4, t: 'Get contacts', d: 'Phone, WhatsApp, email and website are taken from the ads, the Facebook page info and the company website.' },
];

export default function HowItWorks() {
  return (
    <div className="doc">
      <h1>How AdScout works</h1>
      <p className="lead">In four simple steps, AdScout turns thousands of public ads into a ranked list of local businesses you can contact, in any of seven Indian cities.</p>

      <div className="flow">
        {STEPS.map((s) => (
          <div className="flow-step" key={s.n}>
            <span className="step-dot">{s.n}</span>
            <b>{s.t}</b>
            <p>{s.d}</p>
          </div>
        ))}
      </div>

      <h2>What the Performance Score means</h2>
      <p>
        Meta does not show how much money normal businesses in India spend on ads. So we use the signals that are public
        and that marketers trust: businesses keep running ads that bring them customers, and stop ads that do not.
      </p>
      <table>
        <thead>
          <tr><th>Part</th><th>Points</th><th>What it measures</th></tr>
        </thead>
        <tbody>
          <tr><td>Active ads</td><td>{WEIGHTS.activity}</td><td>How many ads are live right now (full points at {CAPS.activeAds}+).</td></tr>
          <tr><td>Ad lifespan</td><td>{WEIGHTS.longevity}</td><td>How long the longest live ad has been running (full points at {CAPS.days}+ days). Long-running ads are usually profitable.</td></tr>
          <tr><td>Platforms</td><td>{WEIGHTS.reach}</td><td>How many places the ads appear: Facebook, Instagram, Messenger… (full points at {CAPS.platforms}+).</td></tr>
          <tr><td>New ads</td><td>{WEIGHTS.freshness}</td><td>How many new ads started in the last 30 days (full points at {CAPS.newAds}+). Shows the business is actively testing.</td></tr>
        </tbody>
      </table>
      <p><b>Levels:</b> 75+ Top performer · 50–74 Strong · 25–49 Moderate · below 25 Getting started.</p>

      <h2>Location match</h2>
      <table>
        <thead><tr><th>Sign found</th><th>Points</th></tr></thead>
        <tbody>
          <tr><td>The city’s name, in English or a local script (e.g. Jaipur / जयपुर, Bengaluru / Bangalore)</td><td>3</td></tr>
          <tr><td>A PIN code of the city</td><td>3</td></tr>
          <tr><td>A landline number with the city’s STD code</td><td>3</td></tr>
          <tr><td>A known local area, e.g. Malviya Nagar, Koramangala, Andheri (up to 2)</td><td>2 each</td></tr>
          <tr><td>A city nickname, e.g. “Pink City” for Jaipur</td><td>1</td></tr>
        </tbody>
      </table>
      <p><b>High</b> = 5+ points, <b>Medium</b> = 3–4, <b>Low</b> = 1–2. Advertisers with no sign of the city are removed.</p>

      <h2>Supported cities</h2>
      <table>
        <thead><tr><th>City</th><th>PIN codes</th><th>STD code</th><th>Local areas on the map</th></tr></thead>
        <tbody>
          {CITIES.map((c) => (
            <tr key={c.id}><td>{c.name}</td><td>{c.pinPrefixes.map((p) => `${p}xxx`).join(', ')}</td><td>0{c.std}</td><td>{Object.keys(c.areas).length}</td></tr>
          ))}
        </tbody>
      </table>
      <p>{totalAreas()} areas in total. Map positions are approximate and show where advertisers cluster.</p>

      <h2>Good to know</h2>
      <ul>
        <li>All data comes from the public Meta Ads Library — the same ads anyone can see at facebook.com/ads/library.</li>
        <li>The score is an estimate from public signals, not actual sales or spend.</li>
        <li>Use contact details responsibly and follow India’s data protection rules (DPDP Act) when reaching out.</li>
      </ul>
      <p><Link href="/">← Back to the dashboard</Link></p>
    </div>
  );
}
