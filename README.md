# Jaipur Ad Finder

Find Jaipur businesses that advertise on Facebook & Instagram (Meta Ads Library), rank the best performers, and collect their contact details — in one simple website built with Microsoft's Fluent UI and ready for Vercel.

## Quick start (on your computer)

```bash
npm install
cp .env.example .env.local   # optional: add your APIFY_TOKEN for live data
npm run dev                  # open http://localhost:3000
```

Without `APIFY_TOKEN` the site runs in **Demo mode** — press **Show sample data** to see everything working with fictional businesses.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. On vercel.com → **Add New → Project** → import the repository (framework: Next.js, no other settings needed).
3. In **Settings → Environment Variables** add `APIFY_TOKEN` (from https://console.apify.com/settings/integrations).
4. Redeploy. The badge on the dashboard turns green: **Live search connected**.

## How it works

| Step | What happens | Code |
| --- | --- | --- |
| 1. Search ads | Starts an Apify scrape of the Meta Ads Library (India, active ads) for "jaipur + business type" | `app/api/scan/start`, `lib/apify.ts` |
| 2. Wait | The page checks progress every 5 s (scrapes take 1–4 min, so Vercel never times out) | `app/api/scan/status` |
| 3. Jaipur check + rank | Ads are cleaned, grouped by advertiser, checked for Jaipur signals and scored 0–100 | `app/api/scan/results`, `lib/normalize.ts`, `lib/jaipur.ts`, `lib/scoring.ts`, `lib/aggregate.ts` |
| 4. Contacts | Phones, emails, WhatsApp, Instagram from ad text + About page; then each company website is visited | `lib/contacts.ts`, `app/api/enrich` |

**Performance Score** = Active ads (35) + Ad lifespan (30) + Platforms (15) + New ads in last 30 days (20).

## Project structure

```
app/
  page.tsx               Dashboard (search, results, table)
  how-it-works/page.tsx  Plain-language explanation page
  providers.tsx          Fluent UI (Microsoft design) setup
  api/                   config · scan/start · scan/status · scan/results · enrich
components/              ScanPanel, Results (KPIs, top 3, charts, table), CompanyDrawer, useScan
lib/                     types, categories, jaipur, contacts, scoring, normalize, aggregate, apify, demo, csv
```

## Notes

- Data comes from the public Meta Ads Library. Meta does not publish spend for ordinary business ads in India, so the score is an estimate from public signals.
- Use contact details responsibly and in line with India's DPDP Act.
