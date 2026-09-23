import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, useColorScheme, View, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
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

  return (
    <ThemeContext.Provider value={theme}>
      <View style={fadeStyles.fill}>
        {children}
        <ThemeFade background={colors.background} />
      </View>
    </ThemeContext.Provider>
  );
}

/** How long the old theme takes to fade away into the new one. */
const THEME_FADE_MS = 350;

/**
 * Switching between light and dark used to snap every colour at once. On a
 * change this lays the old background over the whole app, already drawn in
 * the new colours underneath, and fades it out: the new theme shows through
 * instead of flashing in. It never takes a touch.
 */
function ThemeFade({ background }: { background: string }) {
  const previous = useRef(background);
  const [cover, setCover] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (previous.current === background) return;
    const from = previous.current;
    previous.current = background;
    setCover(from);
    opacity.setValue(1);
    const animation = Animated.timing(opacity, {
      toValue: 0,
      duration: THEME_FADE_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) setCover(null);
    });
    return () => animation.stop();
  }, [background, opacity]);

  if (cover === null) return null;
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: cover, opacity }]} />;
}

const fadeStyles = StyleSheet.create({ fill: { flex: 1 } });

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
