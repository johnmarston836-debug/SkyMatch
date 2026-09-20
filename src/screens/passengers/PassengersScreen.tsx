import React, { useMemo } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/RootNavigator';
import { Avatar } from '../../components/Avatar';
import { BackLink } from '../../components/BackLink';
import { CabinSeats } from '../../components/CabinSeats';
import { LocationBadge } from '../../components/LocationBadge';
import { useChatStore } from '../../state/chatStore';
import { useDiscoveryStore } from '../../state/discoveryStore';
import { useProfileStore } from '../../state/profileStore';
import { useAppTheme, useThemedStyles } from '../../theme/ThemeContext';
import { formatLocation } from '../../utils/location';
import { VENUES } from '../../venues';
import type { ChatMessage, DiscoveredPeer } from '../../types';

type Props = NativeStackScreenProps<MainStackParamList, 'Passengers'>;

interface Conversation {
  peer: DiscoveredPeer;
  lastMessage: ChatMessage | null;
  unread: number;
}

function preview(message: ChatMessage, myId: string | undefined): string {
  const body = message.imageBase64 && !message.body ? 'Foto' : message.body;
  return message.fromId === myId ? `Tú: ${body}` : body;
}

function formatTime(at: number): string {
  const date = new Date(at);
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** The cabin's conversation list: everyone nearby, with the chat you already have with them. */
export function PassengersScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { spacing: themeSpacing } = useAppTheme();
  const peers = useDiscoveryStore((state) => state.peers);
  const messagesByPeer = useChatStore((state) => state.privateMessagesByPeer);
  const unreadByPeer = useChatStore((state) => state.unreadByPeer);
  const myId = useProfileStore((state) => state.profile?.id);
  const myVenue = useProfileStore((state) => state.profile?.location.kind) ?? 'plane';
  const venue = VENUES[myVenue];
  const styles = useThemedStyles(({ colors, radii, spacing, typography }) => ({
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing(3) },
    header: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginBottom: spacing(2) },
    title: typography.title,
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
      marginBottom: spacing(1),
    },
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

    // Live conversations first, newest on top; people you have never written
    // to fall below them, ordered by how recently the radio heard from them.
    return conversations.sort((a, b) => {
      if (a.lastMessage && b.lastMessage) return b.lastMessage.sentAt - a.lastMessage.sentAt;
      if (a.lastMessage) return -1;
      if (b.lastMessage) return 1;
      return b.peer.lastSeenAt - a.peer.lastSeenAt;
    });
  }, [peers, messagesByPeer, unreadByPeer]);

  const renderItem = ({ item }: { item: Conversation }) => {
    const { peer, lastMessage, unread } = item;
    const nickname = peer.profile?.nickname ?? '?';
    return (
      <Pressable style={styles.row} onPress={() => navigation.navigate('Chat', { peerId: peer.peerId })}>
        {/* The photo opens their profile; the rest of the row opens the chat. */}
        <Pressable onPress={() => navigation.navigate('Profile', { peerId: peer.peerId })}>
          <Avatar peerId={peer.peerId} nickname={nickname} size={48} />
        </Pressable>
        <View style={styles.rowBody}>
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
            <Text style={styles.rowPreviewEmpty}>Sin mensajes todavía</Text>
          )}
        </View>
        {unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + themeSpacing(2) }]}>
      <View style={styles.header}>
        <BackLink onPress={() => navigation.goBack()} />
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
