import React, { useEffect } from 'react';
import { Image, Text, View } from 'react-native';
import { usePresenceStore } from '../state/presenceStore';
import { useThemedStyles } from '../theme/ThemeContext';
import { formatSeat } from '../utils/seat';

/** Stack of "seat X is standing up" banners above the group chat, self-clearing as alerts expire. */
export function PresenceBanner() {
  const alerts = usePresenceStore((state) => state.alerts);
  const pruneExpired = usePresenceStore((state) => state.pruneExpired);
  const styles = useThemedStyles(({ colors, radii, spacing }) => ({
    container: { gap: spacing(1) },
    banner: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing(1),
      backgroundColor: colors.surfaceAlt,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing(1.5),
      paddingVertical: spacing(1),
    },
    icon: { width: 16, height: 16, tintColor: colors.accentAlt },
    text: { color: colors.textMuted, fontSize: 13, fontWeight: '500' as const },
    seat: { color: colors.accentAlt, fontWeight: '700' as const },
  }));

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
          <Image source={require('../assets/icons/standing.png')} style={styles.icon} resizeMode="contain" />
          <Text style={styles.text}>
            <Text style={styles.seat}>{formatSeat(alert.seat)}</Text> está de pie
          </Text>
        </View>
      ))}
    </View>
  );
}
