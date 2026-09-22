import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Alert, FlatList, Image, Pressable, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { launchImageLibrary } from 'react-native-image-picker';
import { resize } from 'skymatch-peripheral/image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useChatAutoScroll } from '../../hooks/useChatAutoScroll';
import { useKeyboardPadding } from '../../hooks/useKeyboardPadding';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/RootNavigator';
import { Avatar } from '../../components/Avatar';
import { PhotoViewer } from '../../components/PhotoViewer';
import { QuotedMessage } from '../../components/QuotedMessage';
import { ReplyComposerBar } from '../../components/ReplyComposerBar';
import { SwipeToReply } from '../../components/SwipeToReply';
import { LocationBadge } from '../../components/LocationBadge';
import { useChatStore } from '../../state/chatStore';
import { useAvatarStore } from '../../state/avatarStore';
import { useDiscoveryStore } from '../../state/discoveryStore';
import { useProfileStore } from '../../state/profileStore';
import { requestFullAvatar, sendPrivateChatMessage, sendReadReceipt } from '../../mesh/meshController';
import { colorForPeer } from '../../theme';
import { formatLocation } from '../../utils/location';
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

export function ChatScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { peerId } = route.params;
  const peer = useDiscoveryStore((state) => state.peers[peerId]);
  const peerNickname = peer?.profile?.nickname;
  const messages = useChatStore((state) => state.privateMessagesByPeer[peerId] ?? EMPTY_MESSAGES);
  const myProfile = useProfileStore((state) => state.profile);
  const setActivePeer = useChatStore((state) => state.setActivePeer);
  const markRead = useChatStore((state) => state.markRead);
  const readUpTo = useChatStore((state) => state.readUpToByPeer[peerId] ?? 0);
  const [draft, setDraft] = useState('');
  const keyboardPadding = useKeyboardPadding(insets.bottom);
  const autoScroll = useChatAutoScroll<ChatMessage>();
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);
  const avatarHash = useAvatarStore((state) => state.peerAvatars[peerId]?.hash);
  const hasFace = useAvatarStore((state) => state.peerAvatars[peerId]?.thumb !== undefined);
  const [replyTo, setReplyTo] = useState<ReplyQuote | null>(null);
  const styles = useThemedStyles(({ colors, radii, spacing, typography }) => ({
    container: { flex: 1, backgroundColor: colors.background },
    peerHeader: {
      marginHorizontal: spacing(2),
      marginTop: spacing(1),
      padding: spacing(1.5),
      gap: spacing(0.5),
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    peerHeaderRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing(1) },
    peerName: { fontSize: 15, fontWeight: '700' as const },
    peerContact: { ...typography.body, fontSize: 14 },
    peerContactEmpty: { ...typography.subtitle, fontSize: 13 },
    security: { ...typography.subtitle, fontSize: 12 },
    securityOff: { ...typography.subtitle, fontSize: 12, color: colors.danger },
    list: { padding: spacing(2), gap: spacing(1) },
    bubbleRow: { flexDirection: 'row' as const, marginBottom: spacing(1) },
    bubbleRowMine: { justifyContent: 'flex-end' as const },
    bubble: { maxWidth: '78%' as const, borderRadius: radii.md, paddingHorizontal: spacing(2), paddingVertical: spacing(1.5) },
    bubbleMine: { backgroundColor: colors.text },
    bubbleTheirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    bubbleTextMine: { ...typography.body, color: colors.background },
    bubbleTextTheirs: { ...typography.body },
    seen: { fontSize: 11, color: colors.textMuted, alignSelf: 'flex-end' as const, marginTop: 2 },
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

  useLayoutEffect(() => {
    navigation.setOptions({ title: peerNickname ?? t.chat.title });
  }, [navigation, peerNickname]);

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
  // whenever something new arrives into it.
  useEffect(() => {
    if (myProfile) void sendReadReceipt(myProfile, peerId);
  }, [myProfile, peerId, messages]);

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
            <Text style={mine ? styles.timeMine : styles.time}>{formatTime(item.sentAt)}</Text>
          </View>
          {item.id === lastSeenMine && <Text style={styles.seen}>{t.chat.seen}</Text>}
        </View>
      </SwipeToReply>
    );
  };

  return (
    <Animated.View style={[styles.container, keyboardPadding]}>
      {peer?.profile && (
        <View style={styles.peerHeader}>
          <View style={styles.peerHeaderRow}>
            <Avatar peerId={peerId} nickname={peer.profile.nickname} size={40} zoomable />
            <LocationBadge label={formatLocation(peer.profile.location)} location={peer.profile.location} />
            <Text style={[styles.peerName, { color: colorForPeer(peerId) }]}>{peer.profile.nickname}</Text>
          </View>
          {peer.profile.contact ? (
            <Text style={styles.peerContact}>{peer.profile.contact}</Text>
          ) : (
            <Text style={styles.peerContactEmpty}>{t.chat.noContact}</Text>
          )}
          {peer.secure ? (
            <Text style={styles.security}>{t.chat.encrypted}</Text>
          ) : (
            <Text style={styles.securityOff}>{t.chat.notEncrypted}</Text>
          )}
        </View>
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
