import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="surface empty" style={{ marginTop: 40 }}>
      <span className="eyebrow">404</span>
      <h3>This page doesn’t exist</h3>
      <p>The link may be old or mistyped.</p>
      <p><Link href="/">Go to the dashboard</Link></p>
    </div>
  );
}
