import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/RootNavigator';
import { PresenceBanner } from '../../components/PresenceBanner';
import { SeatBadge } from '../../components/SeatBadge';
import { useChatStore } from '../../state/chatStore';
import { useProfileStore } from '../../state/profileStore';
import { announceBathroomBreak, sendGroupChatMessage, startMesh } from '../../mesh/meshController';
import { colors, radii, spacing, typography } from '../../theme';
import type { ChatMessage } from '../../types';

type Props = NativeStackScreenProps<MainStackParamList, 'CabinChat'>;

export function CabinChatScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const myProfile = useProfileStore((state) => state.profile);
  const groupMessages = useChatStore((state) => state.groupMessages);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (myProfile) void startMesh(myProfile);
  }, [myProfile]);

  if (!myProfile) return null;

  const handleSend = () => {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    void sendGroupChatMessage(myProfile, body);
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const mine = item.fromId === myProfile.id;
    return (
      <Pressable
        style={[styles.bubbleRow, mine && styles.bubbleRowMine]}
        onPress={() => !mine && navigation.navigate('Profile', { peerId: item.fromId })}
        disabled={mine}
      >
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
          {!mine && (
            <View style={styles.senderRow}>
              <SeatBadge seat={item.fromSeat} />
              <Text style={styles.senderName}>{item.fromNickname}</Text>
            </View>
          )}
          <Text style={mine ? styles.bodyTextMine : styles.bodyText}>{item.body}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing(2) }]}>
      <View style={styles.header}>
        <View>
          <Text style={typography.title}>Cabina</Text>
          <Text style={styles.headerSubtitle}>Chat de todo el avión, sin wifi</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('Passengers')}>
          <Text style={styles.passengersLink}>Pasajeros</Text>
        </Pressable>
      </View>

      <View style={styles.bannerArea}>
        <PresenceBanner />
      </View>

      <FlatList
        data={groupMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📡</Text>
            <Text style={[typography.body, styles.emptyTitle]}>Nadie ha hablado todavía</Text>
            <Text style={typography.subtitle}>En cuanto haya pasajeros cerca con la app abierta, aparecerán aquí.</Text>
          </View>
        }
      />

      <View style={[styles.inputRow, { paddingBottom: insets.bottom + spacing(1) }]}>
        <Pressable style={styles.bathroomButton} onPress={() => void announceBathroomBreak(myProfile)}>
          <Text style={styles.bathroomButtonText}>🚻</Text>
        </Pressable>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Escribe a toda la cabina…"
          placeholderTextColor={colors.textMuted}
          onSubmitEditing={handleSend}
        />
        <Pressable style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Enviar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing(3),
    marginBottom: spacing(1),
  },
  headerSubtitle: { ...typography.subtitle, fontSize: 13, marginTop: spacing(0.5) },
  passengersLink: { color: colors.secondary, fontWeight: '700', marginTop: spacing(0.5) },
  bannerArea: { paddingHorizontal: spacing(3) },
  list: { padding: spacing(3), flexGrow: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing(1), paddingTop: spacing(8) },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontWeight: '700', textAlign: 'center' },
  bubbleRow: { marginBottom: spacing(1.5) },
  bubbleRowMine: { alignItems: 'flex-end' },
  bubble: { maxWidth: '82%', borderRadius: radii.md, paddingHorizontal: spacing(2), paddingVertical: spacing(1.2) },
  bubbleTheirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignSelf: 'flex-start' },
  bubbleMine: { backgroundColor: colors.primary, alignSelf: 'flex-end' },
  senderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1), marginBottom: spacing(0.5) },
  senderName: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  bodyText: { ...typography.body },
  bodyTextMine: { ...typography.body, color: colors.background },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    paddingHorizontal: spacing(2),
    paddingTop: spacing(1),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bathroomButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bathroomButtonText: { fontSize: 20 },
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
