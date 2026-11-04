'use client';

import { Badge } from '@fluentui/react-components';
import type { Tier, JaipurLevel } from '@/lib/types';

export const tierColor = (t: Tier) =>
  t === 'Top performer' ? 'success' : t === 'Strong' ? 'brand' : t === 'Moderate' ? 'informative' : 'subtle';

export const tierFill = (score: number) =>
  score >= 75 ? 'var(--colorPaletteGreenBackground3)' : score >= 50 ? 'var(--colorBrandBackground)' : score >= 25 ? 'var(--colorPaletteMarigoldBackground3)' : 'var(--colorNeutralStroke1)';

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <Badge appearance="tint" color={tierColor(tier) as any} shape="rounded">
      {tier}
    </Badge>
  );
}

export function JaipurBadge({ level }: { level: JaipurLevel }) {
  const color = level === 'High' ? 'success' : level === 'Medium' ? 'warning' : 'subtle';
  return (
    <Badge appearance="outline" color={color as any} shape="rounded">
      {level}
    </Badge>
  );
}

export function ScoreBar({ score }: { score: number }) {
  return (
    <div className="score-cell">
      <span className="score-num">{score}</span>
      <div className="mini-track" aria-hidden>
        <div className="mini-fill" style={{ width: `${score}%`, background: tierFill(score) }} />
      </div>
    </div>
  );
}

export const plural = (n: number, one: string, many = one + 's') => `${n.toLocaleString('en-IN')} ${n === 1 ? one : many}`;

export function waLink(num: string) {
  return `https://wa.me/${num.replace(/\D/g, '')}`;
}
