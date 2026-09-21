import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
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
 * Every button in the app: a filled capsule that squashes slightly and dims
 * when pressed.
 *
 * Deliberately flat. It used to carry a painted highlight across its top
 * half and a drop shadow, borrowed from the glass look - and on a dark fill
 * that highlight has a hard bottom edge, which reads as a button split in
 * two rather than as light. A real highlight fades, and fading needs a
 * gradient this app has no library for. The system's own buttons don't have
 * one either: they are a fill, a shape and a reaction to touch.
 */
export function AppButton({
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
  const styles = useThemedStyles(({ colors, spacing, scheme }) => {
    const light = scheme === 'light';
    return {
      surface: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        gap: spacing(0.75),
        borderRadius: radii.pill,
        overflow: 'hidden' as const,
      },
      pill: { paddingHorizontal: spacing(2), paddingVertical: spacing(1) },
      pillLarge: { paddingHorizontal: spacing(3), paddingVertical: spacing(2) },
      round: { width: 44, height: 44, paddingHorizontal: 0, paddingVertical: 0 },
      // The system's own grey for a control with no colour of its own.
      plain: {
        backgroundColor: light ? 'rgba(118,118,128,0.12)' : 'rgba(118,118,128,0.24)',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
      },
      accent: { backgroundColor: colors.accent },
      active: { backgroundColor: colors.accentAlt },
      // Pressing dims as well as squashes, which is what makes a flat button
      // feel like it went down rather than just moved.
      pressed: { opacity: 0.72 },
      disabled: { opacity: 0.4 },
    };
  });

  const spring = (toValue: number) =>
    Animated.spring(scale, { toValue, useNativeDriver: true, speed: 40, bounciness: 6 }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        hitSlop={hitSlop}
        onPressIn={() => spring(0.96)}
        onPressOut={() => spring(1)}
        onPress={onPress}
        style={({ pressed }) => [
          styles.surface,
          round ? styles.round : size === 'lg' ? styles.pillLarge : styles.pill,
          styles[variant],
          pressed && styles.pressed,
          disabled && styles.disabled,
        ]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
