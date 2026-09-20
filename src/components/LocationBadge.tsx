import React from 'react';
import { Text, View } from 'react-native';
import { useThemedStyles } from '../theme/ThemeContext';
import { locationSwatch } from '../utils/location';
import type { UserLocation } from '../types';

interface Props {
  /** Either the rendered label (what a message carries) or the full location. */
  label: string;
  /** Optional: with it, a colour-based location also shows the colour itself. */
  location?: UserLocation;
}

/** The chip that says which person this is: a seat, a coach and seat, a muscle group, a colour. */
export function LocationBadge({ label, location }: Props) {
  const swatch = location ? locationSwatch(location) : null;
  const styles = useThemedStyles(({ colors, radii, spacing }) => ({
    badge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing(0.75),
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.pill,
      paddingHorizontal: spacing(1.5),
      paddingVertical: spacing(0.5),
    },
    dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: colors.border },
    text: { color: colors.text, fontWeight: '700' as const, fontSize: 12 },
  }));

  return (
    <View style={styles.badge}>
      {swatch !== null && <View style={[styles.dot, { backgroundColor: swatch }]} />}
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}
