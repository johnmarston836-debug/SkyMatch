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
      // Under the pane: what the strip falls back to, and what keeps the
      // text legible over a busy conversation when it is there.
      backgroundColor: scheme === 'light' ? 'rgba(255,255,255,0.82)' : 'rgba(10,10,10,0.78)',
      borderTopWidth: StyleSheet.hairlineWidth,
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
