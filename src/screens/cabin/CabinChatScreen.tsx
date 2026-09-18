import React, { useEffect, useState } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/RootNavigator';
import { PresenceBanner } from '../../components/PresenceBanner';
import { SeatBadge } from '../../components/SeatBadge';
import { useChatStore } from '../../state/chatStore';
import { useProfileStore } from '../../state/profileStore';
import { usePresenceStore } from '../../state/presenceStore';
import { sendGroupChatMessage, startMesh, toggleStandUp } from '../../mesh/meshController';
import { colorForPeer } from '../../theme';
import { useAppTheme, useThemedStyles } from '../../theme/ThemeContext';
import type { ChatMessage } from '../../types';

type Props = NativeStackScreenProps<MainStackParamList, 'CabinChat'>;

export function CabinChatScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const myProfile = useProfileStore((state) => state.profile);
  const groupMessages = useChatStore((state) => state.groupMessages);
  const isStanding = usePresenceStore((state) => state.myActiveAlertId !== null);
  const [draft, setDraft] = useState('');
  const styles = useThemedStyles(({ colors, radii, spacing, typography }) => ({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      paddingHorizontal: spacing(3),
      marginBottom: spacing(1),
    },
    title: typography.title,
    headerSubtitle: { ...typography.subtitle, fontSize: 13, marginTop: spacing(0.5) },
    headerActions: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing(1), marginTop: spacing(0.5) },
    myProfileButton: {
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.pill,
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1),
    },
    myProfileButtonText: { color: colors.text, fontWeight: '700' as const, fontSize: 13 },
    passengersButton: {
      backgroundColor: colors.accent,
      borderRadius: radii.pill,
      paddingHorizontal: spacing(2),
      paddingVertical: spacing(1),
    },
    passengersButtonText: { color: '#FFFFFF', fontWeight: '700' as const, fontSize: 13 },
    bannerArea: { paddingHorizontal: spacing(3) },
    list: { padding: spacing(3), flexGrow: 1 },
    emptyState: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, gap: spacing(1), paddingTop: spacing(8) },
    emptyEmoji: { fontSize: 48 },
    emptyTitle: { ...typography.body, fontWeight: '700' as const, textAlign: 'center' as const },
    emptySubtitle: typography.subtitle,
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
    inputRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing(1),
      paddingHorizontal: spacing(2),
      paddingTop: spacing(1),
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
          <View style={[styles.senderRow, mine && styles.senderRowMine]}>
            <SeatBadge seat={item.fromSeat} />
            <Text style={mine ? styles.senderNameMine : [styles.senderName, { color: colorForPeer(item.fromId) }]}>
              {item.fromNickname}
            </Text>
          </View>
          <Text style={mine ? styles.bodyTextMine : styles.bodyText}>{item.body}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + theme.spacing(2) }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Cabina</Text>
          <Text style={styles.headerSubtitle}>Chat de todo el avión, sin wifi</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.myProfileButton} onPress={() => navigation.navigate('MyProfile')}>
            <Text style={styles.myProfileButtonText}>Mi perfil</Text>
          </Pressable>
          <Pressable style={styles.passengersButton} onPress={() => navigation.navigate('Passengers')}>
            <Text style={styles.passengersButtonText}>Pasajeros</Text>
          </Pressable>
        </View>
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
            <Text style={styles.emptyTitle}>Nadie ha hablado todavía</Text>
            <Text style={styles.emptySubtitle}>En cuanto haya pasajeros cerca con la app abierta, aparecerán aquí.</Text>
          </View>
        }
      />

      <View style={[styles.inputRow, { paddingBottom: insets.bottom + theme.spacing(1) }]}>
        <Pressable
          style={[styles.standButton, isStanding && styles.standButtonActive]}
          onPress={() => void toggleStandUp(myProfile)}
        >
          <Image
            source={
              isStanding ? require('../../assets/icons/standing.png') : require('../../assets/icons/seated.png')
            }
            style={[styles.standButtonIcon, isStanding && styles.standButtonIconActive]}
            resizeMode="contain"
          />
        </Pressable>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Escribe a toda la cabina…"
          placeholderTextColor={theme.colors.textMuted}
          onSubmitEditing={handleSend}
        />
        <Pressable style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Enviar</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
