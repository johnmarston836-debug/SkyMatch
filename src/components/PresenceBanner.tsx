import React, { useEffect, useState } from 'react';
import { Image, Pressable, Text, View, type ImageSourcePropType } from 'react-native';
import { ReactionsSheet } from './ReactionsSheet';
import { REACTION_ICONS, REACTION_ORDER } from './reactionIcons';
import { usePresenceStore } from '../state/presenceStore';
import { useProfileStore } from '../state/profileStore';
import { PRESENCE_COUNTDOWN } from '../venues';
import { t } from '../i18n';
import { sendPresenceReaction } from '../mesh/meshController';
import { useThemedStyles } from '../theme/ThemeContext';
import { unpackLocation } from '../utils/location';
import type { PresenceAlert, PresenceReaction, PresenceStatus, ReactionKind } from '../types';

// Stable reference for alerts nobody has reacted to: a fresh [] here would
// make zustand think the snapshot changed on every read and spin forever.
const NO_REACTIONS: PresenceReaction[] = [];

/** The glyph beside the sentence, chosen by what the alert means rather than by where the reader is. */
const ALERT_ICONS: Record<PresenceStatus, ImageSourcePropType> = {
  standing: require('../assets/icons/standing.png'),
  leavingMachine: require('../assets/icons/dumbbell.png'),
};

interface Props {
  /** Opens a private chat with whoever was tapped in the reactions list. */
  onOpenChat: (peerId: string) => void;
}

/** Stack of "seat X is standing up" banners above the group chat, self-clearing as alerts expire. */

/**
 * Who the banner is about. Their name, when the alert carries it: "Pecho
 * deja la máquina" says which bench, not who is leaving it. Where a place
 * has seats the seat stays next to the name, because on a plane or a train
 * it is how you find them; builds that send no name keep showing the
 * location alone.
 */
function whoIsUp(alert: PresenceAlert): string {
  if (!alert.nickname) return alert.label;
  const where = alert.loc ? unpackLocation(alert.loc) : null;
  const hasSeat = where ? where.kind === 'plane' || where.kind === 'train' : alert.status === 'standing';
  return hasSeat && alert.label ? `${alert.nickname} (${alert.label})` : alert.nickname;
}
export function PresenceBanner({ onOpenChat }: Props) {
  const alerts = usePresenceStore((state) => state.alerts);
  const reactionsByAlert = usePresenceStore((state) => state.reactionsByAlert);
  const pruneExpired = usePresenceStore((state) => state.pruneExpired);
  const myProfile = useProfileStore((state) => state.profile);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  // Only "a machine frees up in N minutes" needs it, and there it is the
  // whole message: "in 5 minutes" is a lie four minutes later.
  const [now, setNow] = useState(() => Date.now());
  const [reactionsFor, setReactionsFor] = useState<string | null>(null);
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
    chipsHint: { color: colors.textMuted, fontSize: 11, fontWeight: '600' as const },
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
    const timer = setInterval(() => {
      pruneExpired();
      setNow(Date.now());
    }, 10_000);
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
        // An alert renders by the meaning its sender gave it, not by the
        // venue of whoever is reading: a gym and a bar can share a room.
        const copy = t.presence.byStatus[alert.status] ?? t.presence.byStatus.standing;
        const minutesLeft = Math.max(1, Math.ceil((alert.expiresAt - now) / 60_000));
        const countdown = PRESENCE_COUNTDOWN[alert.status] ? t.presence.countdown(minutesLeft) : '';
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
              <Image source={ALERT_ICONS[alert.status]} style={styles.icon} resizeMode="contain" />
              <Text style={styles.text}>
                {isOwnAlert ? (
                  <>
                    <Text style={styles.seat}>{copy.self}</Text>
                    {countdown}
                  </>
                ) : (
                  <>
                    <Text style={styles.seat}>{whoIsUp(alert)}</Text> {copy.other}
                    {countdown}
                  </>
                )}
              </Text>
              {/* The chips are their own Pressable so they also work on your
                  own banner, where the parent is disabled to stop you
                  reacting to yourself: seeing who reacted to you is the
                  whole point of the list. */}
              {counts.length > 0 && (
                <Pressable style={styles.chips} onPress={() => setReactionsFor(alert.id)}>
                  {counts.map((entry) => (
                    <View key={entry.kind} style={[styles.chip, mine?.kind === entry.kind && styles.chipMine]}>
                      <Image source={REACTION_ICONS[entry.kind]} style={styles.chipIcon} resizeMode="contain" />
                      <Text style={styles.chipCount}>{entry.count}</Text>
                    </View>
                  ))}
                  <Text style={styles.chipsHint}>{t.common.see}</Text>
                </Pressable>
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

      <ReactionsSheet alertId={reactionsFor} onClose={() => setReactionsFor(null)} onOpenChat={onOpenChat} />
    </View>
  );
}
