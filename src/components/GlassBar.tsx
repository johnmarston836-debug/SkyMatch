import React from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { GlassView } from 'skymatch-peripheral/glass';
import { useThemedStyles } from '../theme/ThemeContext';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** How tall it ended up, so the list above can stop before it. */
  onLayout?: (event: LayoutChangeEvent) => void;
}

/**
 * The strip the composer sits on, floating over the conversation.
 *
 * This is the one place in the app where the material has anything to do.
 * Glass works by bending what is behind it, and a button on a flat white
 * screen has nothing behind it - which is why the buttons alone never looked
 * like the system's. Here the messages scroll underneath, so the strip
 * actually picks them up and blurs them.
 */
export function GlassBar({ children, style, onLayout }: Props) {
  const styles = useThemedStyles(({ colors, scheme }) => ({
    bar: {
      // Nothing of our own when the material is there: the point is to see
      // the conversation through it. What is left is the pre-iOS-26 strip.
      backgroundColor: GlassView !== null ? 'transparent' : scheme === 'light' ? 'rgba(255,255,255,0.86)' : 'rgba(10,10,10,0.82)',
      borderTopWidth: GlassView !== null ? 0 : StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    content: { backgroundColor: 'transparent' },
  }));

  return (
    <View style={[styles.bar, style]} onLayout={onLayout}>
      {GlassView !== null && <GlassView style={StyleSheet.absoluteFill} pointerEvents="none" />}
      <View style={styles.content}>{children}</View>
    </View>
  );
}
