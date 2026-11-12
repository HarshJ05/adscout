import { ImageResponse } from 'next/og';

export const alt = 'AdScout: find the local businesses that advertise in your city';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** The preview card shown when the link is shared on WhatsApp, LinkedIn, Slack… */
export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: 'radial-gradient(circle at 70% 20%, #10301F 0%, #050706 60%)', color: '#fff', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 34, fontWeight: 600 }}>
          <div style={{ width: 64, height: 64, borderRadius: 14, background: 'rgba(95,240,178,0.16)', color: '#5FF0B2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>A</div>
          AdScout
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1, maxWidth: 980 }}>Find the local businesses that advertise in your city, ranked.</div>
          <div style={{ fontSize: 30, opacity: 0.85 }}>Meta Ads Library · Performance ranking · Contact details</div>
        </div>
      </div>
    ),
    size
  );
}
