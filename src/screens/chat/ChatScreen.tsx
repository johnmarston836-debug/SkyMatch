import React, { useLayoutEffect, useState } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/RootNavigator';
import { SeatBadge } from '../../components/SeatBadge';
import { useChatStore } from '../../state/chatStore';
import { useDiscoveryStore } from '../../state/discoveryStore';
import { useProfileStore } from '../../state/profileStore';
import { sendPrivateChatMessage } from '../../mesh/meshController';
import { colors, radii, spacing, typography } from '../../theme';
import type { ChatMessage } from '../../types';

type Props = NativeStackScreenProps<MainStackParamList, 'Chat'>;

export function ChatScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { peerId } = route.params;
  const peer = useDiscoveryStore((state) => state.peers[peerId]);
  const messages = useChatStore((state) => state.privateMessagesByPeer[peerId] ?? []);
  const myProfile = useProfileStore((state) => state.profile);
  const [draft, setDraft] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: peer?.profile?.nickname ?? 'Privado' });
  }, [navigation, peer]);

  if (!myProfile) return null;

  const handleSend = () => {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    void sendPrivateChatMessage(myProfile, peerId, body);
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
    void sendPrivateChatMessage(myProfile, peerId, draft.trim() || '📷 Foto', asset.base64);
    setDraft('');
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const mine = item.fromId === myProfile.id;
    return (
      <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
          {item.imageBase64 && (
            <Image source={{ uri: `data:image/jpeg;base64,${item.imageBase64}` }} style={styles.image} resizeMode="cover" />
          )}
          <Text style={mine ? styles.bubbleTextMine : styles.bubbleTextTheirs}>{item.body}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      {peer?.profile && (
        <View style={styles.peerHeader}>
          <SeatBadge seat={peer.profile.seat} />
        </View>
      )}
      <FlatList data={messages} keyExtractor={(item) => item.id} renderItem={renderItem} contentContainerStyle={styles.list} />
      <View style={[styles.inputRow, { paddingBottom: insets.bottom + spacing(1) }]}>
        <Pressable style={styles.attachButton} onPress={handleAttachImage}>
          <Text style={styles.attachButtonText}>📷</Text>
        </Pressable>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Escribe un mensaje…"
          placeholderTextColor={colors.textMuted}
          onSubmitEditing={handleSend}
        />
        <Pressable style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Enviar</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  peerHeader: { paddingHorizontal: spacing(2), paddingTop: spacing(1) },
  list: { padding: spacing(2), gap: spacing(1) },
  bubbleRow: { flexDirection: 'row', marginBottom: spacing(1) },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', borderRadius: radii.md, paddingHorizontal: spacing(2), paddingVertical: spacing(1.5) },
  bubbleMine: { backgroundColor: colors.primary },
  bubbleTheirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  bubbleTextMine: { ...typography.body, color: colors.background },
  bubbleTextTheirs: { ...typography.body },
  image: { width: 220, height: 220, borderRadius: radii.sm, marginBottom: spacing(1) },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    paddingHorizontal: spacing(2),
    paddingTop: spacing(1),
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachButtonText: { fontSize: 18 },
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
  sendButton: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing(2), paddingVertical: spacing(1.2) },
  sendButtonText: { color: colors.background, fontWeight: '700' },
});
