import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { usePresenceStore } from '../state/presenceStore';
import { colors, radii, spacing } from '../theme';
import { formatSeat } from '../utils/seat';

/** Stack of "seat X is in the bathroom" banners above the group chat, self-clearing as alerts expire. */
export function PresenceBanner() {
  const alerts = usePresenceStore((state) => state.alerts);
  const pruneExpired = usePresenceStore((state) => state.pruneExpired);

  useEffect(() => {
    const timer = setInterval(pruneExpired, 10_000);
    return () => clearInterval(timer);
  }, [pruneExpired]);

  const active = Object.values(alerts).sort((a, b) => b.startedAt - a.startedAt);
  if (active.length === 0) return null;

  return (
    <View style={styles.container}>
      {active.map((alert) => (
        <View key={alert.id} style={styles.banner}>
          <Text style={styles.emoji}>🚻</Text>
          <Text style={styles.text}>
            <Text style={styles.seat}>{formatSeat(alert.seat)}</Text> va al baño
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing(1) },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(1),
  },
  emoji: { fontSize: 16 },
  text: { color: colors.textMuted, fontSize: 13, fontWeight: '500' },
  seat: { color: colors.secondary, fontWeight: '700' },
});
