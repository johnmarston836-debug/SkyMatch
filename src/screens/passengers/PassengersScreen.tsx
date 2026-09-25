import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/RootNavigator';
import { Avatar } from '../../components/Avatar';
import { CabinSeats } from '../../components/CabinSeats';
import { SwipeToDelete } from '../../components/SwipeToDelete';
import { LocationBadge } from '../../components/LocationBadge';
import { refreshNearby } from '../../mesh/meshController';
import { useChatStore } from '../../state/chatStore';
import { useDiscoveryStore } from '../../state/discoveryStore';
import { describeConversationPeer, withoutReplaced, type ConversationPeer } from '../../state/conversationPeer';
import { useNow } from '../../hooks/useNow';
import { useProfileStore } from '../../state/profileStore';
import { formatTime } from '../../utils/id';
import { useAppTheme, useThemedStyles } from '../../theme/ThemeContext';
import { venueOf } from '../../venues';
import { t } from '../../i18n';
import type { ChatMessage } from '../../types';

type Props = NativeStackScreenProps<MainStackParamList, 'Passengers'>;

interface Conversation {
  person: ConversationPeer;
  lastMessage: ChatMessage | null;
  unread: number;
  /** For ordering people you haven't written to: when the radio last heard them. */
  lastSeenAt: number;
}

/** Here now first, then lost a moment ago, then long gone. */
const CONNECTION_ORDER = { connected: 0, lost: 1, gone: 2 };

function preview(message: ChatMessage, myId: string | undefined): string {
  const body = message.imageBase64 && !message.body ? t.common.photo : message.body;
  return message.fromId === myId ? t.passengers.ownPreview(body) : body;
}

/** The cabin's conversation list: everyone nearby, with the chat you already have with them. */
/** How long the pull-to-refresh spinner waits for answers to arrive. */
const REFRESH_SETTLE_MS = 2_500;

export function PassengersScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { spacing: themeSpacing } = theme;
  const [refreshing, setRefreshing] = useState(false);
  const peers = useDiscoveryStore((state) => state.peers);
  // Away is worked out from the clock, not stored: it changes with nobody
  // sending anything.
  const now = useNow(15_000);
  const messagesByPeer = useChatStore((state) => state.privateMessagesByPeer);
  const unreadByPeer = useChatStore((state) => state.unreadByPeer);
  const deleteConversation = useChatStore((state) => state.deleteConversation);
  const contacts = useChatStore((state) => state.contacts);
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
    // red delete button behind it show through - and not on the red "no
    // connection" line either, which is the point of the row.
    rowAway: { opacity: 0.55 },
    // Red, like the mark on the photo, and not dimmed with the rest of the row.
    rowOffline: { color: colors.danger, fontSize: 12, fontWeight: '600' as const },
  }));

  const list = useMemo<Conversation[]>(() => {
    // Everyone the radio can hear, plus everyone there is a saved chat with
    // who it no longer can: a conversation must not vanish just because the
    // other person got off the plane.
    const peerIds = new Set([
      ...Object.keys(peers),
      ...Object.keys(messagesByPeer).filter((peerId) => (messagesByPeer[peerId]?.length ?? 0) > 0),
    ]);
    const conversations: Conversation[] = [];
    for (const peerId of peerIds) {
      const person = describeConversationPeer(peerId, peers[peerId], contacts[peerId], now);
      if (!person) continue;
      const thread = messagesByPeer[peerId] ?? [];
      const lastMessage = thread.length > 0 ? thread[thread.length - 1] : null;
      conversations.push({
        person,
        lastMessage,
        unread: unreadByPeer[peerId] ?? 0,
        lastSeenAt: peers[peerId]?.lastSeenAt ?? lastMessage?.sentAt ?? 0,
      });
    }

    // Reachable people first; within each group, live conversations newest
    // on top, then the rest by how recently the radio heard from them.
    return withoutReplaced(conversations).sort((a, b) => {
      const byConnection = CONNECTION_ORDER[a.person.connection] - CONNECTION_ORDER[b.person.connection];
      if (byConnection !== 0) return byConnection;
      if (a.lastMessage && b.lastMessage) return b.lastMessage.sentAt - a.lastMessage.sentAt;
      if (a.lastMessage) return -1;
      if (b.lastMessage) return 1;
      return b.lastSeenAt - a.lastSeenAt;
    });
  }, [peers, messagesByPeer, unreadByPeer, contacts, now]);

  // Pull down: ask everyone in range to answer now. The spinner stays long
  // enough for the answers to come back, so letting go shows the list as it
  // really is rather than as it was a moment ago.
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshNearby().catch(() => {});
    setTimeout(() => setRefreshing(false), REFRESH_SETTLE_MS);
  };

  const confirmDelete = (peerId: string, nickname: string) => {
    Alert.alert(t.passengers.deleteTitle(nickname), t.passengers.deleteBody(nickname), [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.passengers.delete, style: 'destructive', onPress: () => deleteConversation(peerId) },
    ]);
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const { person, lastMessage, unread } = item;
    const { peerId, nickname } = person;
    const away = person.connection !== 'connected';
    return (
      <View style={styles.rowWrap}>
        <SwipeToDelete
          label={t.passengers.delete}
          onDelete={() => confirmDelete(peerId, nickname)}
          // Nothing to delete with someone you have never written to.
          enabled={lastMessage !== null}
        >
          <Pressable style={styles.row} onPress={() => navigation.navigate('Chat', { peerId: peerId })}>
            {/* The photo opens their profile; the rest of the row opens the chat. */}
            <Pressable onPress={() => navigation.navigate('Profile', { peerId: peerId })}>
              <Avatar peerId={peerId} nickname={nickname} size={48} offline={away} />
            </Pressable>
            <View style={styles.rowBody}>
              <View style={[styles.rowTop, away && styles.rowAway]}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {nickname}
                </Text>
                {person.label.length > 0 && <LocationBadge label={person.label} location={person.location} />}
                {lastMessage && <Text style={styles.rowTime}>{formatTime(lastMessage.sentAt)}</Text>}
              </View>
              {lastMessage ? (
                <Text
                  style={[styles.rowPreview, unread > 0 && styles.rowPreviewUnread, away && styles.rowAway]}
                  numberOfLines={1}
                >
                  {preview(lastMessage, myId)}
                </Text>
              ) : (
                <Text style={[styles.rowPreviewEmpty, away && styles.rowAway]}>{t.passengers.noMessagesYet}</Text>
              )}
              {away && (
                <Text style={styles.rowOffline}>
                  {person.connection === 'lost' ? t.passengers.away(person.minutesAway) : t.passengers.offline}
                </Text>
              )}
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
        <FlatList
          data={list}
          keyExtractor={(item) => item.person.peerId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.textMuted} />}
        />
      )}
    </View>
  );
}
