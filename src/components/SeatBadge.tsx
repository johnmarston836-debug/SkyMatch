import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme';
import { formatSeat } from '../utils/seat';
import type { Seat } from '../types';

export function SeatBadge({ seat, muted = false }: { seat: Seat; muted?: boolean }) {
  return (
    <View style={[styles.badge, muted && styles.badgeMuted]}>
      <Text style={[styles.text, muted && styles.textMuted]}>{formatSeat(seat)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radii.pill,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.5),
  },
  badgeMuted: { backgroundColor: colors.surfaceAlt },
  text: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  textMuted: { color: colors.textMuted },
});
