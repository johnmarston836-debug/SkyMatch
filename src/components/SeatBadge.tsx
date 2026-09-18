import React from 'react';
import { Text, View } from 'react-native';
import { useThemedStyles } from '../theme/ThemeContext';
import { formatSeat } from '../utils/seat';
import type { Seat } from '../types';

export function SeatBadge({ seat }: { seat: Seat }) {
  const styles = useThemedStyles(({ colors, radii, spacing }) => ({
    badge: {
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.pill,
      paddingHorizontal: spacing(1.5),
      paddingVertical: spacing(0.5),
    },
    text: { color: colors.text, fontWeight: '700' as const, fontSize: 12 },
  }));

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{formatSeat(seat)}</Text>
    </View>
  );
}
