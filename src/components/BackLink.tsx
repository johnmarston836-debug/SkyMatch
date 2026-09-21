import React from 'react';
import { Text } from 'react-native';
import { GlassButton } from './GlassButton';
import { useThemedStyles } from '../theme/ThemeContext';

/**
 * The same back control on every screen that isn't using the native header,
 * in the same glass idiom as that header's own button.
 */
export function BackLink({ onPress, label = 'Volver' }: { onPress: () => void; label?: string }) {
  const styles = useThemedStyles(({ colors }) => ({
    text: { color: colors.text, fontWeight: '600' as const, fontSize: 15 },
  }));

  return (
    <GlassButton onPress={onPress} accessibilityLabel={label}>
      <Text style={styles.text}>‹ {label}</Text>
    </GlassButton>
  );
}
