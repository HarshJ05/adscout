'use client';

import { Badge } from '@fluentui/react-components';
import type { Tier, GeoLevel } from '@/lib/types';
import { TIER_FILL } from '@/lib/theme';

export const tierColor = (t: Tier) =>
  t === 'Top performer' ? 'success' : t === 'Strong' ? 'brand' : t === 'Moderate' ? 'warning' : 'subtle';

export const tierFill = (score: number) =>
  score >= 75 ? TIER_FILL.top : score >= 50 ? TIER_FILL.strong : score >= 25 ? TIER_FILL.moderate : TIER_FILL.starting;

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <Badge appearance="tint" color={tierColor(tier) as any} shape="rounded">
      {tier}
    </Badge>
  );
}

export function MatchBadge({ level }: { level: GeoLevel }) {
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
