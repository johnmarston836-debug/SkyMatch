import React, { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChatAutoScroll } from '../../hooks/useChatAutoScroll';
import { useKeyboardPadding } from '../../hooks/useKeyboardPadding';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/RootNavigator';
import { CabinSeats } from '../../components/CabinSeats';
import { MeshStatus } from '../../components/MeshStatus';
import { PresenceBanner } from '../../components/PresenceBanner';
import { RadioWarning } from '../../components/RadioWarning';
import { PrivateMessageToast } from '../../components/PrivateMessageToast';
import { QuotedMessage } from '../../components/QuotedMessage';
import { ReplyComposerBar } from '../../components/ReplyComposerBar';
import { SwipeToReply } from '../../components/SwipeToReply';
import { LocationBadge } from '../../components/LocationBadge';
import { unpackLocation } from '../../utils/location';
import { useChatStore } from '../../state/chatStore';
import { useProfileStore } from '../../state/profileStore';
import { usePresenceStore } from '../../state/presenceStore';
import { sendGroupChatMessage, startMesh, togglePresence } from '../../mesh/meshController';
import { ensureNotificationPermission, initNotifications } from '../../notifications/notifier';
import { colorForPeer } from '../../theme';
import { useAppTheme, useThemedStyles } from '../../theme/ThemeContext';
import { formatTime, quoteOf } from '../../utils/id';
import { venueOf } from '../../venues';
import { t } from '../../i18n';
import type { ChatMessage, ReplyQuote } from '../../types';
import { MAX_BODY_CHARS } from '../../mesh/validate';

type Props = NativeStackScreenProps<MainStackParamList, 'CabinChat'>;

export function CabinChatScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const myProfile = useProfileStore((state) => state.profile);
  const groupMessages = useChatStore((state) => state.groupMessages);
  // A count, not an object: a primitive selector can't break the snapshot
  // identity check the way a freshly built array or record would.
  const unreadTotal = useChatStore((state) =>
    Object.values(state.unreadByPeer).reduce((total, count) => total + count, 0),
  );
  const alertActive = usePresenceStore((state) => state.myActiveAlertId !== null);
  // Every word on this screen belongs to the place the user said they were
  // in; the machinery underneath is identical in all of them.
  const venue = venueOf(myProfile?.location.kind ?? 'plane');
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<ReplyQuote | null>(null);
  const keyboardPadding = useKeyboardPadding(insets.bottom);
  const autoScroll = useChatAutoScroll<ChatMessage>();
  const styles = useThemedStyles(({ colors, radii, spacing, typography }) => ({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing(3),
      marginBottom: spacing(2),
    },
    // Both sides take the same share of the row, so the title lands dead
    // centre even though the two buttons aren't the same width.
    headerSide: { flex: 1, alignItems: 'flex-start' as const },
    headerSideRight: { alignItems: 'flex-end' as const },
    // Smaller than a screen title: it has to share the row with two buttons,
    // and it is the piece that gives way when the text is scaled up, so the
    // buttons never get squeezed into a vertical strip of letters.
    title: { ...typography.title, fontSize: 22, flexShrink: 1 },
    myProfileButton: {
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.pill,
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1),
      flexShrink: 0,
    },
    myProfileButtonText: { color: colors.text, fontWeight: '700' as const, fontSize: 13 },
    passengersButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing(0.75),
      backgroundColor: colors.accent,
      borderRadius: radii.pill,
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1),
      flexShrink: 0,
    },
    passengersButtonText: { color: '#FFFFFF', fontWeight: '700' as const, fontSize: 13 },
    unreadBadge: {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 5,
      backgroundColor: '#FFFFFF',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    unreadBadgeText: { color: colors.accent, fontSize: 11, fontWeight: '800' as const },
    bannerArea: { paddingHorizontal: spacing(3) },
    list: { padding: spacing(3), flexGrow: 1 },
    emptyState: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, gap: spacing(1) },
    emptyTitle: { ...typography.body, fontWeight: '700' as const, textAlign: 'center' as const, marginTop: spacing(2) },
    emptySubtitle: { ...typography.subtitle, textAlign: 'center' as const },
    bubbleRow: { marginBottom: spacing(1.5) },
    bubbleRowMine: { alignItems: 'flex-end' as const },
    bubble: { maxWidth: '82%' as const, borderRadius: radii.md, paddingHorizontal: spacing(2), paddingVertical: spacing(1.2) },
    bubbleTheirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignSelf: 'flex-start' as const },
    bubbleMine: { backgroundColor: colors.text, alignSelf: 'flex-end' as const },
    senderRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing(1), marginBottom: spacing(0.5) },
    senderRowMine: { justifyContent: 'flex-end' as const },
    senderName: { fontSize: 12, fontWeight: '700' as const },
    // Own bubbles are filled with `colors.text`, so the name has to invert
    // like the body does rather than use this person's palette colour.
    senderNameMine: { fontSize: 12, fontWeight: '700' as const, color: colors.background },
    bodyText: { ...typography.body },
    bodyTextMine: { ...typography.body, color: colors.background },
    // Small and aligned to the trailing edge, so it reads as a footnote to
    // the message rather than as part of it.
    time: { fontSize: 11, color: colors.textMuted, alignSelf: 'flex-end' as const, marginTop: 2 },
    timeMine: { fontSize: 11, color: colors.background, opacity: 0.6, alignSelf: 'flex-end' as const, marginTop: 2 },
    inputRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing(1),
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1),
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    standButton: {
      width: 44,
      height: 44,
      borderRadius: radii.pill,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    standButtonActive: { backgroundColor: colors.accentAlt, borderColor: colors.accentAlt },
    standButtonIcon: { width: 22, height: 22, tintColor: colors.textMuted },
    standButtonIconActive: { tintColor: '#FFFFFF' },
    input: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1.2),
      color: colors.text,
    },
    sendButton: { backgroundColor: colors.accent, borderRadius: radii.pill, paddingHorizontal: spacing(2), paddingVertical: spacing(1.2) },
    sendButtonText: { color: '#FFFFFF', fontWeight: '700' as const },
  }));

  useEffect(() => {
    if (myProfile) void startMesh(myProfile);
  }, [myProfile]);

  // Asked here rather than at launch: this is the screen where messages
  // start arriving, so the iOS prompt lands with a reason behind it.
  useEffect(() => {
    initNotifications();
    void ensureNotificationPermission();
  }, []);

  if (!myProfile) return null;

  const handleSend = () => {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    setReplyTo(null);
    autoScroll.stickToEnd();
    void sendGroupChatMessage(myProfile, body, replyTo ?? undefined);
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const mine = item.fromId === myProfile.id;
    return (
      <SwipeToReply onReply={() => setReplyTo(quoteOf(item))}>
        <Pressable
          style={[styles.bubbleRow, mine && styles.bubbleRowMine]}
          onPress={() => !mine && navigation.navigate('Profile', { peerId: item.fromId })}
          disabled={mine}
        >
          <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
            <View style={[styles.senderRow, mine && styles.senderRowMine]}>
              {/* The location too, when it came with the message: in a room of colours, the swatch is the badge. */}
              <LocationBadge label={item.fromLabel} location={item.fromLoc ? unpackLocation(item.fromLoc) ?? undefined : undefined} />
              <Text style={mine ? styles.senderNameMine : [styles.senderName, { color: colorForPeer(item.fromId) }]}>
                {item.fromNickname}
              </Text>
            </View>
            {item.replyTo && <QuotedMessage quote={item.replyTo} inverted={mine} />}
            <Text style={mine ? styles.bodyTextMine : styles.bodyText}>{item.body}</Text>
            <Text style={mine ? styles.timeMine : styles.time}>{formatTime(item.sentAt)}</Text>
          </View>
        </Pressable>
      </SwipeToReply>
    );
  };

  return (
    <Animated.View
      style={[styles.container, { paddingTop: insets.top + theme.spacing(2) }, keyboardPadding]}
    >
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <Pressable style={styles.myProfileButton} onPress={() => navigation.navigate('MyProfile')}>
            <Text style={styles.myProfileButtonText} numberOfLines={1}>
              {t.cabin.myProfile}
            </Text>
          </Pressable>
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {venue.spaceTitle}
        </Text>
        <View style={[styles.headerSide, styles.headerSideRight]}>
          <Pressable style={styles.passengersButton} onPress={() => navigation.navigate('Passengers')}>
            <Text style={styles.passengersButtonText} numberOfLines={1}>
              {venue.peopleLabel}
            </Text>
            {unreadTotal > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadTotal > 9 ? '9+' : unreadTotal}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <PrivateMessageToast onOpen={(peerId) => navigation.navigate('Chat', { peerId })} />

      <View style={styles.bannerArea}>
        <RadioWarning />
        <PresenceBanner onOpenChat={(peerId) => navigation.navigate('Chat', { peerId })} />
      </View>

      <FlatList
        ref={autoScroll.listRef}
        data={groupMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onScroll={autoScroll.handleScroll}
        onContentSizeChange={autoScroll.handleContentSizeChange}
        onLayout={autoScroll.handleLayout}
        scrollEventThrottle={16}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {venue.hasSeats && <CabinSeats />}
            <Text style={styles.emptyTitle}>{venue.emptyTitle}</Text>
            <Text style={styles.emptySubtitle}>{venue.emptySubtitle}</Text>
            <MeshStatus />
          </View>
        }
      />

      <ReplyComposerBar quote={replyTo} onCancel={() => setReplyTo(null)} />

      <View style={styles.inputRow}>
        <Pressable
          style={[styles.standButton, alertActive && styles.standButtonActive]}
          onPress={() => void togglePresence(myProfile)}
        >
          <Image
            source={alertActive ? venue.alertIconActive : venue.alertIcon}
            style={[styles.standButtonIcon, alertActive && styles.standButtonIconActive]}
            resizeMode="contain"
          />
        </Pressable>
        <TextInput
          selectionColor={theme.colors.accent}
          cursorColor={theme.colors.accent}
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder={venue.composerPlaceholder}
          maxLength={MAX_BODY_CHARS}
          placeholderTextColor={theme.colors.textMuted}
          onSubmitEditing={handleSend}
        />
        <Pressable style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>{t.common.send}</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}
