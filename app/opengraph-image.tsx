import { ImageResponse } from 'next/og';

export const alt = 'Jaipur Ad Finder — find Jaipur businesses that advertise';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** The preview card shown when the link is shared on WhatsApp, LinkedIn, Slack… */
export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: '#0f6cbd', color: '#fff', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 34, fontWeight: 600 }}>
          <div style={{ width: 64, height: 64, borderRadius: 14, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>J</div>
          Jaipur Ad Finder
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1, maxWidth: 980 }}>Find Jaipur businesses that advertise — and see who does it best.</div>
          <div style={{ fontSize: 30, opacity: 0.85 }}>Meta Ads Library · Performance ranking · Contact details</div>
        </div>
      </div>
    ),
    size
  );
}
