import { createDarkTheme, type BrandVariants, type Theme } from '@fluentui/react-components';

/**
 * Black + Jaipur emerald. Jaipur is the world's emerald-cutting centre, so the
 * accent is a gem green rather than a neon one.
 */
export const COLORS = {
  ink: '#050706',
  base: '#08100C',
  surface: '#0D1612',
  raised: '#121E18',
  line: 'rgba(214, 255, 233, 0.09)',
  text: '#E9F2ED',
  muted: '#93A89E',
  emerald: '#2FBF85',
  mint: '#5FF0B2',
  deep: '#0E5A3F',
  gold: '#D9B45A',
} as const;

const emerald: BrandVariants = {
  10: '#020F09',
  20: '#04190F',
  30: '#062616',
  40: '#08331D',
  50: '#0B4126',
  60: '#0E5031',
  70: '#12603B',
  80: '#177146',
  90: '#1D8452',
  100: '#25985F',
  110: '#2FAD6D',
  120: '#3CC27C',
  130: '#55D290',
  140: '#76DEA6',
  150: '#9AE9BE',
  160: '#C1F3D7',
};

const base = createDarkTheme(emerald);

export const emeraldTheme: Theme = {
  ...base,
  fontFamilyBase: "'Manrope Variable', 'Manrope', 'Segoe UI', system-ui, sans-serif",
  colorBrandBackground: emerald[120],
  colorBrandBackgroundHover: emerald[130],
  colorBrandBackgroundPressed: emerald[110],
  colorBrandBackgroundSelected: emerald[120],
  colorCompoundBrandBackground: emerald[130],
  colorCompoundBrandBackgroundHover: emerald[140],
  colorCompoundBrandStroke: emerald[130],
  colorNeutralForegroundOnBrand: '#03130B',
  colorBrandForeground1: emerald[140],
  colorBrandForeground2: emerald[150],
  colorBrandForegroundLink: emerald[140],
  colorBrandForegroundLinkHover: emerald[150],
  colorBrandStroke1: emerald[120],
  colorBrandStroke2: emerald[60],
  colorBrandBackground2: emerald[30],
  colorBrandBackground2Hover: emerald[40],
  colorNeutralBackground1: COLORS.surface,
  colorNeutralBackground1Hover: COLORS.raised,
  colorNeutralBackground1Pressed: '#0A120E',
  colorNeutralBackground1Selected: COLORS.raised,
  colorNeutralBackground2: COLORS.base,
  colorNeutralBackground3: COLORS.raised,
  colorNeutralBackground4: '#18261F',
  colorNeutralBackground5: '#1D2D25',
  colorNeutralBackground6: '#22342B',
  colorSubtleBackgroundHover: 'rgba(214,255,233,0.06)',
  colorSubtleBackgroundPressed: 'rgba(214,255,233,0.10)',
  colorNeutralStroke1: 'rgba(214,255,233,0.16)',
  colorNeutralStroke1Hover: 'rgba(214,255,233,0.26)',
  colorNeutralStroke2: COLORS.line,
  colorNeutralStroke3: 'rgba(214,255,233,0.06)',
  colorNeutralForeground1: COLORS.text,
  colorNeutralForeground2: '#C4D3CB',
  colorNeutralForeground3: COLORS.muted,
  colorNeutralForeground4: '#6C8077',
  colorStrokeFocus2: emerald[140],
};

/** Tier colours, shared by the map, table and report. */
export const TIER_FILL = {
  top: COLORS.mint,
  strong: COLORS.emerald,
  moderate: COLORS.gold,
  starting: '#51655B',
} as const;
