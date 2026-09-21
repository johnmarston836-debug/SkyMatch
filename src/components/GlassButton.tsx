import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { radii } from '../theme';
import { useThemedStyles } from '../theme/ThemeContext';

interface Props {
  onPress: () => void;
  children: React.ReactNode;
  /** 'plain' borrows the background; 'accent' is the primary action; 'active' marks a toggle that is on. */
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

/**
 * Every button in the app: a rounded surface with a hairline that catches
 * the light along its top edge, a soft shadow that lifts it off the page,
 * and a springy squash when pressed.
 *
 * Drawn in React Native on purpose. There was a version of this backed by
 * SwiftUI's own glass button, and it was abandoned: React Native lays out
 * with Yoga and cannot measure a SwiftUI label, so the button had to report
 * its own size back and the result came out small, and taps on a SwiftUI
 * button hosted inside the renderer never reached their handler. Two
 * problems that cost more than the material was worth. It is all in the
 * history if it is ever worth another go.
 */
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
  const styles = useThemedStyles((theme) => {
    const { colors, spacing } = theme;
    const light = theme.scheme === 'light';
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
      plain: {
        backgroundColor: light ? 'rgba(118,118,128,0.12)' : 'rgba(118,118,128,0.28)',
        borderColor: light ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.10)',
      },
      accent: { backgroundColor: colors.accent, borderColor: 'rgba(255,255,255,0.22)' },
      active: { backgroundColor: colors.accentAlt, borderColor: 'rgba(255,255,255,0.22)' },
      disabled: { opacity: 0.4 },
      // Two pieces, not one: a single flat band over a saturated fill reads
      // as a button split in half rather than as a highlight.
      rim: {
        position: 'absolute' as const,
        left: 0,
        right: 0,
        top: 0,
        height: 1,
        backgroundColor: light ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.28)',
      },
      sheen: { position: 'absolute' as const, left: 0, right: 0, top: 0, height: '45%' as const },
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
