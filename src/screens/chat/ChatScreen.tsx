import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { launchImageLibrary } from 'react-native-image-picker';
import { resize } from 'skymatch-peripheral/image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useChatAutoScroll } from '../../hooks/useChatAutoScroll';
import { useKeyboardPadding } from '../../hooks/useKeyboardPadding';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/RootNavigator';
import { Padlock } from '../../components/Padlock';
import { useBlockStore } from '../../state/blockStore';
import { Avatar } from '../../components/Avatar';
import { PhotoViewer } from '../../components/PhotoViewer';
import { QuotedMessage } from '../../components/QuotedMessage';
import { ReplyComposerBar } from '../../components/ReplyComposerBar';
import { SwipeToReply } from '../../components/SwipeToReply';
import { LocationBadge } from '../../components/LocationBadge';
import { useChatStore } from '../../state/chatStore';
import { useAvatarStore } from '../../state/avatarStore';
import { useDiscoveryStore } from '../../state/discoveryStore';
import { describeConversationPeer } from '../../state/conversationPeer';
import { useNow } from '../../hooks/useNow';
import { useProfileStore } from '../../state/profileStore';
import {
  requestFullAvatar,
  retryPrivateMessage,
  sendPrivateChatMessage,
  sendReadReceipt,
} from '../../mesh/meshController';
import { colorForPeer } from '../../theme';
import { t } from '../../i18n';
import { formatTime, quoteOf } from '../../utils/id';
import { MAX_BODY_CHARS } from '../../mesh/validate';
import { useAppTheme, useThemedStyles } from '../../theme/ThemeContext';
import type { ChatMessage, ReplyQuote } from '../../types';

type Props = NativeStackScreenProps<MainStackParamList, 'Chat'>;

// Stable reference for the "no messages yet" case: returning a fresh `[]`
// from a zustand selector makes React think the snapshot changes on every
// read (it never `Object.is`-equals the previous one), which spins into an
// infinite render loop - exactly the failure mode this constant avoids.
const EMPTY_MESSAGES: ChatMessage[] = [];

/**
 * The heaviest photo a private message will carry, in base64 characters:
 * about 30KB, or some 500 Bluetooth frames. Anything more takes long enough
 * to cross that the link is likely to drop half way.
 */
const MAX_CHAT_IMAGE_CHARS = 40_000;

/** The ··· in the top bar that opens what can be done about this person. */
function OptionsButton({ onPress }: { onPress: () => void }) {
  const styles = useThemedStyles(({ colors }) => ({
    text: { color: colors.text, fontSize: 16, fontWeight: '800' as const, letterSpacing: 1, paddingHorizontal: 4 },
  }));
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button" accessibilityLabel={t.chat.options}>
      <Text style={styles.text}>•••</Text>
    </Pressable>
  );
}

export function ChatScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { peerId } = route.params;
  const peer = useDiscoveryStore((state) => state.peers[peerId]);
  const savedContact = useChatStore((state) => state.contacts[peerId]);
  const now = useNow(15_000);
  // Who this is, whether the radio can still hear them or all that is left
  // is the saved chat.
  const person = describeConversationPeer(peerId, peer, savedContact, now);
  const peerNickname = person?.nickname;
  const messages = useChatStore((state) => state.privateMessagesByPeer[peerId] ?? EMPTY_MESSAGES);
  const myProfile = useProfileStore((state) => state.profile);
  const setActivePeer = useChatStore((state) => state.setActivePeer);
  const markRead = useChatStore((state) => state.markRead);
  const readUpTo = useChatStore((state) => state.readUpToByPeer[peerId] ?? 0);
  const muted = useBlockStore((state) => state.muted[peerId] === true);
  const toggleMuted = useBlockStore((state) => state.toggle);
  const [draft, setDraft] = useState('');
  const keyboardPadding = useKeyboardPadding(insets.bottom);
  const autoScroll = useChatAutoScroll<ChatMessage>();
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);
  const avatarHash = useAvatarStore((state) => state.peerAvatars[peerId]?.hash);
  const hasFace = useAvatarStore((state) => state.peerAvatars[peerId]?.thumb !== undefined);
  const [replyTo, setReplyTo] = useState<ReplyQuote | null>(null);
  const styles = useThemedStyles(({ colors, radii, spacing, typography }) => ({
    container: { flex: 1, backgroundColor: colors.background },
    // Who you are talking to, in as little room as it takes: one centred
    // line for the face, the name and where they are, one for what they
    // shared, one for the state of the chat. The conversation below is
    // what the screen is for.
    peerHeader: {
      alignItems: 'center' as const,
      gap: 2,
      paddingHorizontal: spacing(2),
      paddingTop: spacing(1),
      paddingBottom: spacing(1.25),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    peerHeaderRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: spacing(1),
      maxWidth: '100%' as const,
    },
    peerName: { fontSize: 15, fontWeight: '700' as const, flexShrink: 1 },
    peerContact: { ...typography.body, fontSize: 13, textAlign: 'center' as const },
    peerContactEmpty: { ...typography.subtitle, fontSize: 12, textAlign: 'center' as const },
    mutedNotice: {
      ...typography.subtitle,
      fontSize: 12,
      color: colors.danger,
      textAlign: 'center' as const,
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1),
    },
    mutedUndo: { fontWeight: '700' as const, textDecorationLine: 'underline' as const },
    statusRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5 },
    security: { ...typography.subtitle, fontSize: 12 },
    securityOff: { ...typography.subtitle, fontSize: 12, color: colors.danger, textAlign: 'center' as const },
    list: { padding: spacing(2), gap: spacing(1) },
    bubbleRow: { flexDirection: 'row' as const, marginBottom: spacing(1) },
    bubbleRowMine: { justifyContent: 'flex-end' as const },
    bubble: { maxWidth: '78%' as const, borderRadius: radii.md, paddingHorizontal: spacing(2), paddingVertical: spacing(1.5) },
    bubbleMine: { backgroundColor: colors.text },
    bubbleTheirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    bubbleTextMine: { ...typography.body, color: colors.background },
    bubbleTextTheirs: { ...typography.body },
    undelivered: {
      fontSize: 11,
      fontWeight: '600' as const,
      color: colors.danger,
      textAlign: 'right' as const,
      marginTop: -spacing(0.5),
      marginBottom: spacing(1),
    },
    time: { fontSize: 11, color: colors.textMuted, alignSelf: 'flex-end' as const, marginTop: 2 },
    timeMine: { fontSize: 11, color: colors.background, opacity: 0.6, alignSelf: 'flex-end' as const, marginTop: 2 },
    image: { width: 220, height: 220, borderRadius: radii.sm, marginBottom: spacing(1) },
    inputRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing(1),
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1),
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    attachButton: {
      width: 44,
      height: 44,
      borderRadius: radii.pill,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    attachButtonIcon: { width: 22, height: 22, tintColor: colors.textMuted },
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

  /**
   * What you can do about this person without leaving the chat. Silencing
   * used to live only on their profile card, which a chat never led to -
   * so once you had written to someone there was no way to silence them.
   * Three buttons at most: Android's alert shows no more.
   */
  const openOptions = useCallback(() => {
    const nickname = peerNickname ?? t.chat.title;
    Alert.alert(nickname, undefined, [
      { text: t.chat.viewProfile, onPress: () => navigation.navigate('Profile', { peerId }) },
      {
        text: muted ? t.profile.unmute : t.profile.mute,
        style: muted ? 'default' : 'destructive',
        onPress: () => void toggleMuted(peerId),
      },
      { text: t.common.cancel, style: 'cancel' },
    ]);
  }, [muted, navigation, peerId, peerNickname, toggleMuted]);

  const renderOptions = useCallback(() => <OptionsButton onPress={openOptions} />, [openOptions]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: peerNickname ?? t.chat.title, headerRight: renderOptions });
  }, [navigation, peerNickname, renderOptions]);

  // While this conversation is on screen its messages are read as they land,
  // so they neither raise the badge nor pop up a banner over the cabin chat.
  useFocusEffect(
    useCallback(() => {
      setActivePeer(peerId);
      markRead(peerId);
      return () => setActivePeer(null);
    }, [peerId, setActivePeer, markRead]),
  );

  // Told to them while the conversation is actually on screen, and again
  // whenever something new arrives into it - or when the phone comes back
  // to it, since what landed while it was locked has only now been seen.
  const onScreen = useChatStore((state) => state.appActive && state.activePeerId === peerId);
  useEffect(() => {
    if (myProfile && onScreen) void sendReadReceipt(myProfile, peerId);
  }, [myProfile, peerId, messages, onScreen]);

  // Their photo here is small, but it can be opened full screen, and someone
  // deep in a conversation with one person is exactly who the portrait is
  // worth sending to. Same reason as ProfileScreen for asking again when
  // their face lands rather than only when the screen opens.
  useEffect(() => {
    void requestFullAvatar(peerId);
  }, [peerId, avatarHash, hasFace]);

  if (!myProfile) return null;

  const handleSend = () => {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    setReplyTo(null);
    autoScroll.stickToEnd();
    void sendPrivateChatMessage(myProfile, peerId, body, undefined, replyTo ?? undefined);
  };

  const handleAttachImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
      maxWidth: 480,
      maxHeight: 480,
      quality: 0.5, // small on purpose - see MeshService.sendPrivateMessage on BLE bandwidth
    });
    const asset = result.assets?.[0];
    if (!asset?.base64) return;

    // A busy photo can come back several times heavier than a plain one of
    // the same size, and every 80 characters of it is another Bluetooth
    // frame. Squeeze it before giving up on it.
    let image = asset.base64;
    if (image.length > MAX_CHAT_IMAGE_CHARS) {
      image = (await resize(image, 360, 0.4)) ?? image;
    }
    if (image.length > MAX_CHAT_IMAGE_CHARS) {
      Alert.alert(t.myProfile.photoTooBigTitle, t.myProfile.photoTooBigBody);
      return;
    }

    autoScroll.stickToEnd();
    void sendPrivateChatMessage(myProfile, peerId, draft.trim() || t.common.photo, image, replyTo ?? undefined);
    setDraft('');
    setReplyTo(null);
  };

  const lastSeenMine = (() => {
    let id: string | null = null;
    for (const message of messages) {
      if (message.fromId === myProfile?.id && message.sentAt <= readUpTo) id = message.id;
    }
    return id;
  })();

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const mine = item.fromId === myProfile.id;
    return (
      <SwipeToReply onReply={() => setReplyTo(quoteOf(item))}>
        <View>
          <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
            <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
              {item.replyTo && <QuotedMessage quote={item.replyTo} inverted={mine} />}
              {item.imageBase64 && (
                <Pressable onPress={() => setZoomedPhoto(item.imageBase64 ?? null)}>
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${item.imageBase64}` }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                </Pressable>
              )}
              <Text style={mine ? styles.bubbleTextMine : styles.bubbleTextTheirs}>{item.body}</Text>
              {/* "Seen" rides with the time, inside the bubble: beside it, it
                  pushed the bubble off the right edge and left a gap there. */}
              <Text style={mine ? styles.timeMine : styles.time}>
                {formatTime(item.sentAt)}
                {item.id === lastSeenMine ? ` · ${t.chat.seen}` : ''}
              </Text>
            </View>
          </View>
          {mine && item.undelivered && (
            <Pressable onPress={() => retryPrivateMessage(peerId, item.id)} accessibilityRole="button" hitSlop={8}>
              <Text style={styles.undelivered}>{t.chat.undelivered}</Text>
            </Pressable>
          )}
        </View>
      </SwipeToReply>
    );
  };

  return (
    <Animated.View style={[styles.container, keyboardPadding]}>
      {person && (
        <View style={styles.peerHeader}>
          <View style={styles.peerHeaderRow}>
            <Avatar
              peerId={peerId}
              nickname={person.nickname}
              size={36}
              zoomable
              offline={person.connection !== 'connected'}
            />
            <Text
              style={[styles.peerName, { color: colorForPeer(peerId) }]}
              numberOfLines={1}
              onPress={() => navigation.navigate('Profile', { peerId })}
            >
              {person.nickname}
            </Text>
            {person.label.length > 0 && <LocationBadge label={person.label} location={person.location} />}
          </View>
          {person.contact ? (
            <Text style={styles.peerContact} selectable>
              {person.contact}
            </Text>
          ) : (
            person.connection !== 'gone' && <Text style={styles.peerContactEmpty}>{t.chat.noContact}</Text>
          )}
          {person.connection === 'lost' && <Text style={styles.securityOff}>{t.chat.away(person.minutesAway)}</Text>}
          {person.connection === 'gone' && <Text style={styles.securityOff}>{t.chat.offline}</Text>}
          {/* Whether they announced keys is only known while the radio hears them. */}
          {person.connection !== 'gone' &&
            (person.secure ? (
              <View style={styles.statusRow}>
                <Padlock color={theme.colors.textMuted} size={10} />
                <Text style={styles.security}>{t.chat.encrypted}</Text>
              </View>
            ) : (
              <Text style={styles.securityOff}>{t.chat.notEncrypted}</Text>
            ))}
        </View>
      )}
      {muted && person && (
        <Text style={styles.mutedNotice} onPress={() => void toggleMuted(peerId)}>
          {t.chat.mutedNotice(person.nickname)} <Text style={styles.mutedUndo}>{t.profile.unmute}</Text>
        </Text>
      )}
      <FlatList
        ref={autoScroll.listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onScroll={autoScroll.handleScroll}
        onContentSizeChange={autoScroll.handleContentSizeChange}
        onLayout={autoScroll.handleLayout}
        scrollEventThrottle={16}
      />
      <PhotoViewer imageBase64={zoomedPhoto} onClose={() => setZoomedPhoto(null)} />

      <ReplyComposerBar quote={replyTo} onCancel={() => setReplyTo(null)} />

      <View style={styles.inputRow}>
        <Pressable style={styles.attachButton} onPress={handleAttachImage}>
          <Image source={require('../../assets/icons/camera.png')} style={styles.attachButtonIcon} resizeMode="contain" />
        </Pressable>
        <TextInput
          selectionColor={theme.colors.accent}
          cursorColor={theme.colors.accent}
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder={t.chat.placeholder}
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
