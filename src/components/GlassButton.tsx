import React, { useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { GlassButtonView, GlassView } from 'skymatch-peripheral/glass';
import { radii } from '../theme';
import { useAppTheme, useThemedStyles } from '../theme/ThemeContext';

interface Props {
  onPress: () => void;
  /**
   * The label, when it is plain text. With it, the button is SwiftUI's own
   * glass button - the one Apple draws and animates - instead of one of
   * ours. Without it, `children` are rendered on a glass surface, which is
   * what the buttons made of our own pictograms need.
   */
  title?: string;
  /** Small count beside the label, as on the people button. */
  badge?: string;
  children?: React.ReactNode;
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
 * A button on a pane of the system's own glass, with a springy squash when
 * pressed.
 *
 * The coloured variants are tinted glass rather than paint, which is what
 * makes a prominent glass button prominent: the material still shows what is
 * behind it, coloured. Paint over glass is just paint, and the glass under it
 * is wasted.
 *
 * The drawn fill, rim and sheen are what a phone without the material falls
 * back to. They are deliberately near-invisible when the real thing is
 * present: a painted highlight on top of a material that already has one
 * reads as a mistake, and that is what made the first version look wrong.
 */
export function GlassButton({
  onPress,
  title,
  badge,
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
  // SwiftUI measures the label; Yoga can't. The button reports the size it
  // wants and it is applied back as a style - one extra pass, against a C++
  // shadow node as the only alternative.
  const [measured, setMeasured] = useState<{ width: number; height: number } | null>(null);
  const accent = useAppTheme().colors[variant === 'active' ? 'accentAlt' : 'accent'];
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
      round: {
        width: 44,
        height: 44,
        paddingHorizontal: 0,
        paddingVertical: 0,
      },
      // With glass behind, the fill is only there to keep the label
      // legible over whatever the material picks up; without it, the fill
      // is the whole button.
      // Always drawn, glass or no glass. A colour laid on at partial
      // strength so the material shows through comes out washed: over a flat
      // white background there is nothing behind it to darken it back, and a
      // primary action ends up looking disabled. The fill carries the
      // colour; the pane on top of it adds the material's own light.
      plain: {
        backgroundColor: light ? 'rgba(118,118,128,0.12)' : 'rgba(118,118,128,0.28)',
        borderColor: light ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.10)',
      },
      accent: { backgroundColor: colors.accent, borderColor: 'rgba(255,255,255,0.22)' },
      active: { backgroundColor: colors.accentAlt, borderColor: 'rgba(255,255,255,0.22)' },
      disabled: { opacity: 0.4 },
      rim: {
        position: 'absolute' as const,
        left: 0,
        right: 0,
        top: 0,
        height: 1,
        backgroundColor: light
          ? 'rgba(255,255,255,0.85)'
          : 'rgba(255,255,255,0.28)',
      },
      sheen: {
        position: 'absolute' as const,
        left: 0,
        right: 0,
        top: 0,
        height: '45%' as const,
      },
      sheenPlain: {
        backgroundColor: light
          ? 'rgba(255,255,255,0.45)'
          : 'rgba(255,255,255,0.08)',
      },
      sheenFilled: {
        backgroundColor: light
          ? 'rgba(255,255,255,0.14)'
          : 'rgba(255,255,255,0.09)',
      },
      shadow: {
        shadowColor: '#000000',
        shadowOpacity: light ? 0.1 : 0.4,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        borderRadius: radii.pill,
      },
    };
  });

  if (GlassButtonView !== null && title !== undefined) {
    return (
      <GlassButtonView
        title={title}
        badge={badge}
        prominent={variant !== 'plain'}
        enabled={!disabled}
        tint={variant === 'plain' ? undefined : accent}
        onGlassPress={() => !disabled && onPress()}
        onGlassSize={(event) => setMeasured(event.nativeEvent)}
        style={[
          // A full-width action stretches; a pill is as wide as its label.
          size === 'lg' ? { height: measured?.height } : measured ?? undefined,
          style,
        ]}
      />
    );
  }

  const spring = (toValue: number) =>
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();

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
        {GlassView !== null && (
          <GlassView style={StyleSheet.absoluteFill} cornerRadius={radii.pill} pointerEvents="none" />
        )}
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
