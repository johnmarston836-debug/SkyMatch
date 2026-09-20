import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useThemedStyles } from '../theme/ThemeContext';

/**
 * A button in the system's glass idiom: a translucent fill that borrows the
 * colour underneath, a hairline that catches the light along the top edge, a
 * soft shadow that lifts it off the page, and a springy squash when pressed.
 *
 * It is drawn rather than taken from UIKit. A real `UIGlassEffect` needs a
 * native view, and what it does that this can't is blur what is behind it -
 * which over these flat backgrounds is the same colour it already is. Where
 * it would show (the composer over a scrolling conversation) is the one
 * place worth spending a native component on later.
 */
interface Props {
  onPress: () => void;
  children: React.ReactNode;
  /** 'plain' borrows the background; 'accent' is the filled blue one. */
  variant?: 'plain' | 'accent' | 'active';
  /** A circular icon button rather than a pill with a label. */
  round?: boolean;
  /** 'lg' is the full-width primary action at the bottom of a screen. */
  size?: 'md' | 'lg';
  /** Layout only - margins and alignment. The surface itself comes from the variant. */
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  hitSlop?: number;
  accessibilityLabel?: string;
}

export function GlassButton({
  onPress,
  children,
  variant = 'plain',
  round = false,
  size = 'md',
  style,
  disabled = false,
  hitSlop = 6,
  accessibilityLabel,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const styles = useThemedStyles(({ colors, radii, spacing, scheme }) => {
    const light = scheme === 'light';
    return {
      surface: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        gap: spacing(0.75),
        borderRadius: radii.pill,
        borderWidth: StyleSheet.hairlineWidth,
        overflow: 'hidden' as const,
      },
      pill: { paddingHorizontal: spacing(2), paddingVertical: spacing(1) },
      pillLarge: { paddingHorizontal: spacing(3), paddingVertical: spacing(2) },
      round: { width: 44, height: 44, paddingHorizontal: 0, paddingVertical: 0 },
      // A translucent grey is what the system uses for a button that has no
      // colour of its own: it darkens what is under it without picking a
      // side between the two themes.
      plain: {
        backgroundColor: light ? 'rgba(118,118,128,0.12)' : 'rgba(118,118,128,0.28)',
        borderColor: light ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.10)',
      },
      accent: { backgroundColor: colors.accent, borderColor: 'rgba(255,255,255,0.22)' },
      active: { backgroundColor: colors.accentAlt, borderColor: 'rgba(255,255,255,0.22)' },
      disabled: { opacity: 0.4 },
      // The light along the top edge, which is what makes glass legible -
      // not the blur. Two pieces, because a single flat band over a
      // saturated fill reads as a button split in half rather than as a
      // highlight: a hairline rim right at the edge, and a much fainter
      // sheen fading under it.
      rim: {
        position: 'absolute' as const,
        left: 0,
        right: 0,
        top: 0,
        height: 1,
        backgroundColor: light ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.28)',
      },
      sheen: {
        position: 'absolute' as const,
        left: 0,
        right: 0,
        top: 0,
        height: '45%' as const,
      },
      // A translucent grey pill can take a bright sheen; a saturated blue
      // one cannot, and washes out long before it starts to look like glass.
      sheenPlain: { backgroundColor: light ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.08)' },
      sheenFilled: { backgroundColor: light ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.09)' },
      shadow: {
        shadowColor: '#000000',
        shadowOpacity: light ? 0.1 : 0.4,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        borderRadius: radii.pill,
      },
    };
  });

  const spring = (toValue: number) =>
    Animated.spring(scale, { toValue, useNativeDriver: true, speed: 40, bounciness: 6 }).start();

  return (
    <Animated.View style={[styles.shadow, { transform: [{ scale }] }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        hitSlop={hitSlop}
        onPressIn={() => spring(0.94)}
        onPressOut={() => spring(1)}
        onPress={onPress}
        style={[
          styles.surface,
          round ? styles.round : size === 'lg' ? styles.pillLarge : styles.pill,
          styles[variant],
          disabled && styles.disabled,
        ]}
      >
        <View
          style={[styles.sheen, variant === 'plain' ? styles.sheenPlain : styles.sheenFilled]}
          pointerEvents="none"
        />
        <View style={styles.rim} pointerEvents="none" />
        {children}
      </Pressable>
    </Animated.View>
  );
}
