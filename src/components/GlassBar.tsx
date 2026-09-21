import React from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
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
 * Nearly opaque rather than see-through: the messages scroll underneath it,
 * and text over text is unreadable long before it is pretty.
 */
export function GlassBar({ children, style, onLayout }: Props) {
  const styles = useThemedStyles(({ colors, scheme }) => ({
    bar: {
      backgroundColor: scheme === 'light' ? 'rgba(255,255,255,0.94)' : 'rgba(10,10,10,0.94)',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
  }));

  return (
    <View style={[styles.bar, style]} onLayout={onLayout}>
      {children}
    </View>
  );
}
