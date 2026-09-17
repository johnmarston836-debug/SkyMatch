export const colors = {
  background: '#0B1220',
  surface: '#141E33',
  surfaceAlt: '#1C2B4A',
  border: '#2A3B5E',
  primary: '#FF6B5B', // sunset orange - the "flight" accent
  primaryMuted: '#7A3A33',
  secondary: '#4FD1C5', // sky teal
  text: '#F4F6FB',
  textMuted: '#9AA7C7',
  success: '#4FD17E',
  danger: '#E5484D',
};

export const spacing = (multiplier: number) => multiplier * 8;

export const radii = {
  sm: 10,
  md: 18,
  lg: 28,
  pill: 999,
};

export const typography = {
  title: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  subtitle: { fontSize: 16, fontWeight: '400' as const, color: colors.textMuted },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
  label: { fontSize: 13, fontWeight: '600' as const, color: colors.textMuted, letterSpacing: 0.5 },
};
