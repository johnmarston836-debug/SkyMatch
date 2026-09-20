import React from 'react';
import { FlatList, Image, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from './Avatar';
import { LocationBadge } from './LocationBadge';
import { REACTION_ICONS } from './reactionIcons';
import { useDiscoveryStore } from '../state/discoveryStore';
import { usePresenceStore } from '../state/presenceStore';
import { useProfileStore } from '../state/profileStore';
import { useThemedStyles } from '../theme/ThemeContext';
import type { PresenceReaction } from '../types';

// Same trick as everywhere else: a fresh [] from a selector would make
// zustand think the snapshot changed on every read.
const NO_REACTIONS: PresenceReaction[] = [];

interface Props {
  /** The alert whose reactions to list, or null when the sheet is closed. */
  alertId: string | null;
  onClose: () => void;
  onOpenChat: (peerId: string) => void;
}

/** Who reacted to a "standing up" banner - and a way straight into a chat with them. */
export function ReactionsSheet({ alertId, onClose, onOpenChat }: Props) {
  const insets = useSafeAreaInsets();
  const reactionsByAlert = usePresenceStore((state) => state.reactionsByAlert);
  const peers = useDiscoveryStore((state) => state.peers);
  const myId = useProfileStore((state) => state.profile?.id);
  const styles = useThemedStyles(({ colors, radii, spacing, typography }) => ({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' as const },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: radii.lg,
      borderTopRightRadius: radii.lg,
      paddingHorizontal: spacing(3),
      paddingTop: spacing(2),
      maxHeight: '70%' as const,
    },
    grabber: { alignSelf: 'center' as const, width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border },
    title: { ...typography.body, fontWeight: '700' as const, marginTop: spacing(2), marginBottom: spacing(1) },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing(1.5),
      paddingVertical: spacing(1.5),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowBody: { flex: 1, gap: spacing(0.5) },
    rowTop: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing(1) },
    rowName: { ...typography.body, fontWeight: '700' as const, flexShrink: 1 },
    rowHint: { ...typography.subtitle, fontSize: 12 },
    reactionIcon: { width: 22, height: 22, tintColor: colors.text },
    empty: { ...typography.subtitle, paddingVertical: spacing(3), textAlign: 'center' as const },
    close: { paddingVertical: spacing(2), alignItems: 'center' as const },
    closeText: { ...typography.body, fontWeight: '700' as const },
  }));

  const reactions = alertId ? reactionsByAlert[alertId] ?? NO_REACTIONS : NO_REACTIONS;

  const renderItem = ({ item }: { item: PresenceReaction }) => {
    const profile = peers[item.fromId]?.profile;
    // Someone can react before their profile announcement has come round
    // again, so the seat - which travels inside the reaction itself - is the
    // fallback name.
    const name = profile?.nickname ?? item.fromLabel;
    const mine = item.fromId === myId;

    return (
      <Pressable
        style={styles.row}
        disabled={mine}
        onPress={() => {
          onClose();
          onOpenChat(item.fromId);
        }}
      >
        <Avatar peerId={item.fromId} nickname={name} size={40} />
        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text style={styles.rowName} numberOfLines={1}>
              {mine ? 'Tú' : name}
            </Text>
            <LocationBadge label={item.fromLabel} location={profile?.location} />
          </View>
          {!mine && <Text style={styles.rowHint}>Toca para escribirle</Text>}
        </View>
        <Image source={REACTION_ICONS[item.kind]} style={styles.reactionIcon} resizeMode="contain" />
      </Pressable>
    );
  };

  return (
    <Modal visible={alertId !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Swallows taps so pressing inside the sheet doesn't close it. */}
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]} onPress={() => {}}>
          <View style={styles.grabber} />
          <Text style={styles.title}>
            {reactions.length === 1 ? '1 reacción' : `${reactions.length} reacciones`}
          </Text>
          {reactions.length === 0 ? (
            <Text style={styles.empty}>Todavía no ha reaccionado nadie.</Text>
          ) : (
            <FlatList data={reactions} keyExtractor={(item) => item.id} renderItem={renderItem} />
          )}
          <Pressable style={styles.close} onPress={onClose}>
            <Text style={styles.closeText}>Cerrar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
