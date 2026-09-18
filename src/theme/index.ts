/**
 * Deliberately minimal: white in light mode, black in dark mode, no accent
 * tint anywhere in the base palette. Color is spent only on the handful of
 * things that need to stand out - `accent` (send button, passengers button,
 * primary CTAs) and `accentAlt` (stand-up button only - a distinct blue so
 * the two buttons sitting side by side in the cabin chat don't blend
 * together) - plus each person's name in chat (see `colorForPeer` below).
 * Everything else (badges, bubbles, selection states) stays grayscale.
 */
export const lightColors = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  surfaceAlt: '#E8E8E8',
  border: '#D8D8D8',
  text: '#0A0A0A',
  textMuted: '#6B6B6B',
  accent: '#2563EB', // send button, passengers button, primary CTAs
  accentAlt: '#0891B2', // stand-up button only
  danger: '#E5484D',
};

export const darkColors = {
  background: '#000000',
  surface: '#141414',
  surfaceAlt: '#212121',
  border: '#2E2E2E',
  text: '#FAFAFA',
  textMuted: '#9A9A9A',
  accent: '#2563EB',
  accentAlt: '#0891B2',
  danger: '#E5484D',
};

export type ThemeColors = typeof lightColors;

export const spacing = (multiplier: number) => multiplier * 8;

export const radii = {
  sm: 10,
  md: 18,
  lg: 28,
  pill: 999,
};

export function getTypography(colors: ThemeColors) {
  return {
    title: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
    subtitle: { fontSize: 16, fontWeight: '400' as const, color: colors.textMuted },
    body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
    label: { fontSize: 13, fontWeight: '600' as const, color: colors.textMuted, letterSpacing: 0.5 },
  };
}

export type Typography = ReturnType<typeof getTypography>;

/**
 * One name color per person, so the group chat reads like a real
 * conversation at a glance. Deterministic (hash of peer id) so it's stable
 * across a session, and picked from hues legible on both a white and a
 * black background rather than a light- or dark-specific palette.
 */
const NAME_PALETTE = ['#E4572E', '#2E86AB', '#5B8C5A', '#8E44AD', '#C2185B', '#D68910', '#00897B', '#3F51B5'];

export function colorForPeer(peerId: string): string {
  let hash = 0;
  for (let i = 0; i < peerId.length; i++) hash = (hash * 31 + peerId.charCodeAt(i)) >>> 0;
  return NAME_PALETTE[hash % NAME_PALETTE.length];
}
