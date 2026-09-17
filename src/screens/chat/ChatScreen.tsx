import React, { useLayoutEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/RootNavigator';
import { useChatStore } from '../../state/chatStore';
import { useMatchStore } from '../../state/matchStore';
import { useProfileStore } from '../../state/profileStore';
import { getMeshService } from '../../mesh/meshController';
import { newId } from '../../utils/id';
import { colors, radii, spacing, typography } from '../../theme';
import type { ChatMessage } from '../../types';

type Props = NativeStackScreenProps<MainStackParamList, 'Chat'>;

export function ChatScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { matchId } = route.params;
  const match = useMatchStore((state) => state.matches[matchId]);
  const messages = useChatStore((state) => state.messagesByMatch[matchId] ?? []);
  const addMessage = useChatStore((state) => state.addMessage);
  const myProfile = useProfileStore((state) => state.profile);
  const [draft, setDraft] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: match?.peerProfile.name ?? 'Chat' });
  }, [navigation, match]);

  if (!match || !myProfile) return null;

  const handleSend = () => {
    const body = draft.trim();
    if (!body) return;
    const message: ChatMessage = {
      id: newId(),
      matchId,
      fromId: myProfile.id,
      toId: match.peerId,
      body,
      sentAt: Date.now(),
    };
    addMessage(message);
    setDraft('');
    void getMeshService()?.sendChatMessage(message);
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const mine = item.fromId === myProfile.id;
    return (
      <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
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
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        inverted={false}
      />
      <View style={[styles.inputRow, { paddingBottom: insets.bottom + spacing(1) }]}>
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
  list: { padding: spacing(2), gap: spacing(1) },
  bubbleRow: { flexDirection: 'row', marginBottom: spacing(1) },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', borderRadius: radii.md, paddingHorizontal: spacing(2), paddingVertical: spacing(1.5) },
  bubbleMine: { backgroundColor: colors.primary },
  bubbleTheirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  bubbleTextMine: { ...typography.body, color: colors.background },
  bubbleTextTheirs: { ...typography.body },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    paddingHorizontal: spacing(2),
    paddingTop: spacing(1),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
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
