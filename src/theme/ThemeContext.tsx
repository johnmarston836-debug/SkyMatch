import React, { createContext, useContext, useMemo } from 'react';
import { StyleSheet, useColorScheme, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { darkColors, getTypography, lightColors, radii, spacing, type ThemeColors, type Typography } from './index';

interface Theme {
  colors: ThemeColors;
  typography: Typography;
  spacing: typeof spacing;
  radii: typeof radii;
  scheme: 'light' | 'dark';
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme() === 'light' ? 'light' : 'dark'; // no system setting (e.g. simulator quirk) defaults to dark
  const colors = scheme === 'light' ? lightColors : darkColors;

  const theme = useMemo<Theme>(
    () => ({ colors, typography: getTypography(colors), spacing, radii, scheme }),
    [colors, scheme],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useAppTheme must be used within a ThemeProvider');
  return theme;
}

/** Builds a StyleSheet from the current theme, recomputed only when the theme (i.e. light/dark) changes. */
export function useThemedStyles<T extends Record<string, ViewStyle | TextStyle | ImageStyle>>(
  factory: (theme: Theme) => T,
): T {
  const theme = useAppTheme();
  // `factory` is intentionally excluded: callers pass a fresh inline closure
  // every render, and re-running it on every render (instead of only when
  // the theme itself changes) would defeat the point of memoizing at all.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
}
