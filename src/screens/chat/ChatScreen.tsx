import React, { useCallback, useLayoutEffect, useState } from 'react';
import { FlatList, Image, Pressable, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { launchImageLibrary } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useChatAutoScroll } from '../../hooks/useChatAutoScroll';
import { useKeyboardPadding } from '../../hooks/useKeyboardPadding';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/RootNavigator';
import { Avatar } from '../../components/Avatar';
import { ComposerBar } from '../../components/ComposerBar';
import { AppButton } from '../../components/AppButton';
import { PhotoViewer } from '../../components/PhotoViewer';
import { QuotedMessage } from '../../components/QuotedMessage';
import { ReplyComposerBar } from '../../components/ReplyComposerBar';
import { SwipeToReply } from '../../components/SwipeToReply';
import { LocationBadge } from '../../components/LocationBadge';
import { useChatStore } from '../../state/chatStore';
import { useDiscoveryStore } from '../../state/discoveryStore';
import { useProfileStore } from '../../state/profileStore';
import { sendPrivateChatMessage } from '../../mesh/meshController';
import { colorForPeer } from '../../theme';
import { formatLocation } from '../../utils/location';
import { quoteOf } from '../../utils/id';
import { useAppTheme, useThemedStyles } from '../../theme/ThemeContext';
import type { ChatMessage, ReplyQuote } from '../../types';

type Props = NativeStackScreenProps<MainStackParamList, 'Chat'>;

// Stable reference for the "no messages yet" case: returning a fresh `[]`
// from a zustand selector makes React think the snapshot changes on every
// read (it never `Object.is`-equals the previous one), which spins into an
// infinite render loop - exactly the failure mode this constant avoids.
const EMPTY_MESSAGES: ChatMessage[] = [];

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
  const [draft, setDraft] = useState('');
  const keyboardPadding = useKeyboardPadding(insets.bottom);
  const autoScroll = useChatAutoScroll<ChatMessage>();
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<ReplyQuote | null>(null);
  // The composer floats over the conversation, so the list has to end above
  // it rather than behind it - and the strip's height depends on the text
  // size the reader chose, so it is measured rather than guessed.
  const [composerHeight, setComposerHeight] = useState(64);
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
    list: { padding: spacing(2), gap: spacing(1) },
    bubbleRow: { flexDirection: 'row' as const, marginBottom: spacing(1) },
    bubbleRowMine: { justifyContent: 'flex-end' as const },
    bubble: { maxWidth: '78%' as const, borderRadius: radii.md, paddingHorizontal: spacing(2), paddingVertical: spacing(1.5) },
    bubbleMine: { backgroundColor: colors.text },
    bubbleTheirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    bubbleTextMine: { ...typography.body, color: colors.background },
    bubbleTextTheirs: { ...typography.body },
    image: { width: 220, height: 220, borderRadius: radii.sm, marginBottom: spacing(1) },
    composer: { position: 'absolute' as const, left: 0, right: 0, bottom: 0 },
    inputRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing(1),
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1),
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
    sendButtonText: { color: '#FFFFFF', fontWeight: '700' as const },
  }));

  useLayoutEffect(() => {
    navigation.setOptions({ title: peerNickname ?? 'Privado' });
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
    autoScroll.stickToEnd();
    void sendPrivateChatMessage(myProfile, peerId, draft.trim() || 'Foto', asset.base64, replyTo ?? undefined);
    setDraft('');
    setReplyTo(null);
  };

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
          </View>
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
            <Text style={styles.peerContactEmpty}>No ha compartido contacto</Text>
          )}
        </View>
      )}
      <FlatList
        ref={autoScroll.listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingBottom: composerHeight + theme.spacing(2) }]}
        onScroll={autoScroll.handleScroll}
        onContentSizeChange={autoScroll.handleContentSizeChange}
        onLayout={autoScroll.handleLayout}
        scrollEventThrottle={16}
      />
      <PhotoViewer imageBase64={zoomedPhoto} onClose={() => setZoomedPhoto(null)} />

      <ComposerBar style={styles.composer} onLayout={(event) => setComposerHeight(event.nativeEvent.layout.height)}>
        <ReplyComposerBar quote={replyTo} onCancel={() => setReplyTo(null)} />

        <View style={styles.inputRow}>
          <AppButton round onPress={handleAttachImage} accessibilityLabel="Enviar una foto">
            <Image source={require('../../assets/icons/camera.png')} style={styles.attachButtonIcon} resizeMode="contain" />
          </AppButton>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Escribe un mensaje…"
            placeholderTextColor={theme.colors.textMuted}
            onSubmitEditing={handleSend}
          />
          <AppButton variant="accent" onPress={handleSend}>
            <Text style={styles.sendButtonText}>Enviar</Text>
          </AppButton>
        </View>
      </ComposerBar>
    </Animated.View>
  );
}
