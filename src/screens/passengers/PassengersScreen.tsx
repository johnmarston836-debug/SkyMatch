import React, { useMemo } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/RootNavigator';
import { Avatar } from '../../components/Avatar';
import { CabinSeats } from '../../components/CabinSeats';
import { SwipeToDelete } from '../../components/SwipeToDelete';
import { LocationBadge } from '../../components/LocationBadge';
import { useChatStore } from '../../state/chatStore';
import { isAway, minutesAway, useDiscoveryStore } from '../../state/discoveryStore';
import { useNow } from '../../hooks/useNow';
import { useProfileStore } from '../../state/profileStore';
import { formatTime } from '../../utils/id';
import { useAppTheme, useThemedStyles } from '../../theme/ThemeContext';
import { formatLocation } from '../../utils/location';
import { venueOf } from '../../venues';
import { t } from '../../i18n';
import type { ChatMessage, DiscoveredPeer } from '../../types';

type Props = NativeStackScreenProps<MainStackParamList, 'Passengers'>;

interface Conversation {
  peer: DiscoveredPeer;
  lastMessage: ChatMessage | null;
  unread: number;
}

function preview(message: ChatMessage, myId: string | undefined): string {
  const body = message.imageBase64 && !message.body ? t.common.photo : message.body;
  return message.fromId === myId ? t.passengers.ownPreview(body) : body;
}

/** The cabin's conversation list: everyone nearby, with the chat you already have with them. */
export function PassengersScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { spacing: themeSpacing } = useAppTheme();
  const peers = useDiscoveryStore((state) => state.peers);
  // Away is worked out from the clock, not stored: it changes with nobody
  // sending anything.
  const now = useNow(15_000);
  const messagesByPeer = useChatStore((state) => state.privateMessagesByPeer);
  const unreadByPeer = useChatStore((state) => state.unreadByPeer);
  const deleteConversation = useChatStore((state) => state.deleteConversation);
  const myId = useProfileStore((state) => state.profile?.id);
  const myVenue = useProfileStore((state) => state.profile?.location.kind) ?? 'plane';
  const venue = venueOf(myVenue);
  const styles = useThemedStyles(({ colors, radii, spacing, typography }) => ({
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing(3) },
    header: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginBottom: spacing(2) },
    title: typography.title,
    backLink: { color: colors.text, fontWeight: '600' as const },
    headerSpacer: { width: 60 },
    emptyState: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, gap: spacing(2) },
    emptySubtitle: { ...typography.subtitle, textAlign: 'center' as const },
    list: { gap: spacing(1) },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing(2),
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing(2),
    },
    // The gap between rows lives outside the row, so the red button a swipe
    // reveals behind it is exactly the row's height.
    rowWrap: { marginBottom: spacing(1) },
    rowBody: { flex: 1, gap: spacing(0.5) },
    rowTop: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing(1) },
    rowName: { ...typography.body, fontWeight: '700' as const, flexShrink: 1 },
    rowTime: { ...typography.subtitle, fontSize: 12, marginLeft: 'auto' as const },
    rowPreview: { ...typography.subtitle, fontSize: 13 },
    rowPreviewUnread: { color: colors.text, fontWeight: '700' as const },
    rowPreviewEmpty: { ...typography.subtitle, fontSize: 13, fontStyle: 'italic' as const },
    unreadBadge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      paddingHorizontal: 6,
      backgroundColor: colors.accent,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    unreadBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' as const },
    // On what the row shows, not on the row: a see-through row would let the
    // red delete button behind it show through.
    rowAway: { opacity: 0.55 },
    rowAwayText: { ...typography.subtitle, fontSize: 12 },
  }));

  const list = useMemo<Conversation[]>(() => {
    const conversations = Object.values(peers)
      .filter((peer) => peer.profile)
      .map((peer) => {
        const thread = messagesByPeer[peer.peerId] ?? [];
        return {
          peer,
          lastMessage: thread.length > 0 ? thread[thread.length - 1] : null,
          unread: unreadByPeer[peer.peerId] ?? 0,
        };
      });

    // People here now before people away; within each, live conversations
    // first, newest on top, then the rest by how recently the radio heard
    // from them.
    return conversations.sort((a, b) => {
      const awayA = isAway(a.peer, now);
      const awayB = isAway(b.peer, now);
      if (awayA !== awayB) return awayA ? 1 : -1;
      if (a.lastMessage && b.lastMessage) return b.lastMessage.sentAt - a.lastMessage.sentAt;
      if (a.lastMessage) return -1;
      if (b.lastMessage) return 1;
      return b.peer.lastSeenAt - a.peer.lastSeenAt;
    });
  }, [peers, messagesByPeer, unreadByPeer, now]);

  const confirmDelete = (peerId: string, nickname: string) => {
    Alert.alert(t.passengers.deleteTitle(nickname), t.passengers.deleteBody(nickname), [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.passengers.delete, style: 'destructive', onPress: () => deleteConversation(peerId) },
    ]);
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const { peer, lastMessage, unread } = item;
    const nickname = peer.profile?.nickname ?? '?';
    const away = isAway(peer, now);
    return (
      <View style={styles.rowWrap}>
        <SwipeToDelete
          label={t.passengers.delete}
          onDelete={() => confirmDelete(peer.peerId, nickname)}
          // Nothing to delete with someone you have never written to.
          enabled={lastMessage !== null}
        >
          <Pressable style={styles.row} onPress={() => navigation.navigate('Chat', { peerId: peer.peerId })}>
            {/* The photo opens their profile; the rest of the row opens the chat. */}
            <Pressable style={away && styles.rowAway} onPress={() => navigation.navigate('Profile', { peerId: peer.peerId })}>
              <Avatar peerId={peer.peerId} nickname={nickname} size={48} />
            </Pressable>
            <View style={[styles.rowBody, away && styles.rowAway]}>
              <View style={styles.rowTop}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {nickname}
                </Text>
                {peer.profile && (
                  <LocationBadge label={formatLocation(peer.profile.location)} location={peer.profile.location} />
                )}
                {lastMessage && <Text style={styles.rowTime}>{formatTime(lastMessage.sentAt)}</Text>}
              </View>
              {lastMessage ? (
                <Text style={[styles.rowPreview, unread > 0 && styles.rowPreviewUnread]} numberOfLines={1}>
                  {preview(lastMessage, myId)}
                </Text>
              ) : (
                <Text style={styles.rowPreviewEmpty}>{t.passengers.noMessagesYet}</Text>
              )}
              {away && <Text style={styles.rowAwayText}>{t.passengers.away(minutesAway(peer, now))}</Text>}
            </View>
            {unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            )}
          </Pressable>
        </SwipeToDelete>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + themeSpacing(2) }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>← {t.common.back}</Text>
        </Pressable>
        <Text style={styles.title}>{venue.peopleLabel}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {list.length === 0 ? (
        <View style={styles.emptyState}>
          {venue.hasSeats && <CabinSeats />}
          <Text style={styles.emptySubtitle}>{venue.peopleSearching}</Text>
        </View>
      ) : (
        <FlatList data={list} keyExtractor={(item) => item.peer.peerId} renderItem={renderItem} contentContainerStyle={styles.list} />
      )}
    </View>
  );
}
