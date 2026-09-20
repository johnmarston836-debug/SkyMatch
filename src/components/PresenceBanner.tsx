import React, { useEffect, useState } from 'react';
import { Image, Pressable, Text, View, type ImageSourcePropType } from 'react-native';
import { usePresenceStore } from '../state/presenceStore';
import { useProfileStore } from '../state/profileStore';
import { sendPresenceReaction } from '../mesh/meshController';
import { useThemedStyles } from '../theme/ThemeContext';
import { formatSeat } from '../utils/seat';
import type { PresenceReaction, ReactionKind } from '../types';

/** Drawn by hand rather than emoji, which render as tofu boxes on some devices. */
const REACTION_ICONS: Record<ReactionKind, ImageSourcePropType> = {
  ok: require('../assets/icons/reaction-ok.png'),
  heart: require('../assets/icons/reaction-heart.png'),
  laugh: require('../assets/icons/reaction-laugh.png'),
};

const REACTION_ORDER: ReactionKind[] = ['ok', 'heart', 'laugh'];

// Stable reference for alerts nobody has reacted to: a fresh [] here would
// make zustand think the snapshot changed on every read and spin forever.
const NO_REACTIONS: PresenceReaction[] = [];

/** Stack of "seat X is standing up" banners above the group chat, self-clearing as alerts expire. */
export function PresenceBanner() {
  const alerts = usePresenceStore((state) => state.alerts);
  const reactionsByAlert = usePresenceStore((state) => state.reactionsByAlert);
  const pruneExpired = usePresenceStore((state) => state.pruneExpired);
  const myProfile = useProfileStore((state) => state.profile);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const styles = useThemedStyles(({ colors, radii, spacing }) => ({
    container: { gap: spacing(1) },
    banner: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing(1.5),
      paddingVertical: spacing(1),
      gap: spacing(1),
    },
    headline: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing(1) },
    icon: { width: 16, height: 16, tintColor: colors.accentAlt },
    text: { color: colors.textMuted, fontSize: 13, fontWeight: '500' as const, flex: 1 },
    seat: { color: colors.accentAlt, fontWeight: '700' as const },

    chips: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing(0.75) },
    chip: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing(0.5),
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.pill,
      paddingHorizontal: spacing(1),
      paddingVertical: spacing(0.5),
    },
    chipMine: { borderColor: colors.accent },
    chipIcon: { width: 14, height: 14, tintColor: colors.text },
    chipCount: { color: colors.text, fontSize: 12, fontWeight: '700' as const },

    picker: {
      flexDirection: 'row' as const,
      gap: spacing(1),
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: spacing(1),
    },
    pickerButton: {
      width: 40,
      height: 40,
      borderRadius: radii.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    pickerButtonActive: { borderColor: colors.accent, backgroundColor: colors.accent },
    pickerIcon: { width: 22, height: 22, tintColor: colors.text },
    pickerIconActive: { tintColor: '#FFFFFF' },
  }));

  useEffect(() => {
    const timer = setInterval(pruneExpired, 10_000);
    return () => clearInterval(timer);
  }, [pruneExpired]);

  const active = Object.values(alerts).sort((a, b) => b.startedAt - a.startedAt);
  if (active.length === 0) return null;

  const react = (alertId: string, kind: ReactionKind) => {
    if (!myProfile) return;
    setPickerFor(null);
    void sendPresenceReaction(myProfile, alertId, kind);
  };

  return (
    <View style={styles.container}>
      {active.map((alert) => {
        const reactions = reactionsByAlert[alert.id] ?? NO_REACTIONS;
        const mine = reactions.find((reaction) => reaction.fromId === myProfile?.id);
        const isOwnAlert = alert.fromId === myProfile?.id;
        const counts = REACTION_ORDER.map((kind) => ({
          kind,
          count: reactions.filter((reaction) => reaction.kind === kind).length,
        })).filter((entry) => entry.count > 0);

        return (
          <Pressable
            key={alert.id}
            style={styles.banner}
            // Reacting to your own "I'm standing up" would be noise, so only
            // everyone else gets the picker.
            disabled={isOwnAlert}
            onPress={() => setPickerFor(pickerFor === alert.id ? null : alert.id)}
          >
            <View style={styles.headline}>
              <Image source={require('../assets/icons/standing.png')} style={styles.icon} resizeMode="contain" />
              <Text style={styles.text}>
                {isOwnAlert ? (
                  <Text style={styles.seat}>Estás de pie</Text>
                ) : (
                  <>
                    <Text style={styles.seat}>{formatSeat(alert.seat)}</Text> está de pie
                  </>
                )}
              </Text>
              {counts.length > 0 && (
                <View style={styles.chips}>
                  {counts.map((entry) => (
                    <View key={entry.kind} style={[styles.chip, mine?.kind === entry.kind && styles.chipMine]}>
                      <Image source={REACTION_ICONS[entry.kind]} style={styles.chipIcon} resizeMode="contain" />
                      <Text style={styles.chipCount}>{entry.count}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {pickerFor === alert.id && (
              <View style={styles.picker}>
                {REACTION_ORDER.map((kind) => (
                  <Pressable
                    key={kind}
                    style={[styles.pickerButton, mine?.kind === kind && styles.pickerButtonActive]}
                    onPress={() => react(alert.id, kind)}
                  >
                    <Image
                      source={REACTION_ICONS[kind]}
                      style={[styles.pickerIcon, mine?.kind === kind && styles.pickerIconActive]}
                      resizeMode="contain"
                    />
                  </Pressable>
                ))}
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
