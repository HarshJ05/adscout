import Link from 'next/link';

export function AppFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <b>Jaipur Ad Finder</b>
          <p>Find Jaipur businesses that advertise on Facebook and Instagram, see who does it best, and reach them.</p>
        </div>
        <div className="footer-col">
          <span>Product</span>
          <Link href="/">Dashboard</Link>
          <Link href="/how-it-works">How it works</Link>
        </div>
        <div className="footer-col">
          <span>Data sources</span>
          <a href="https://www.facebook.com/ads/library/" target="_blank" rel="noreferrer">Meta Ads Library</a>
          <a href="https://adstransparency.google.com/?region=IN" target="_blank" rel="noreferrer">Google Ads Transparency</a>
        </div>
      </div>
      <div className="footer-legal">
        Built on public ad data. Performance scores are estimates from public ad signals, not actual spend. Use contact
        details responsibly and in line with India’s DPDP Act.
      </div>
    </footer>
  );
}
