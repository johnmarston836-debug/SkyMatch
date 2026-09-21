import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/RootNavigator';
import { Avatar } from '../../components/Avatar';
import { LocationBadge } from '../../components/LocationBadge';
import { useChatStore } from '../../state/chatStore';
import { useBlockStore } from '../../state/blockStore';
import { useDiscoveryStore } from '../../state/discoveryStore';
import { colorForPeer } from '../../theme';
import { describeLocation, formatLocation } from '../../utils/location';
import { t } from '../../i18n';
import { useAppTheme, useThemedStyles } from '../../theme/ThemeContext';

type Props = NativeStackScreenProps<MainStackParamList, 'Profile'>;

/** Reached by tapping someone's name anywhere in the app. Shows only what they chose to share. */
export function ProfileScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { spacing: themeSpacing } = useAppTheme();
  const { peerId } = route.params;
  const peer = useDiscoveryStore((state) => state.peers[peerId]);
  const profile = peer?.profile;
  // The invitation to start talking only makes sense before there is
  // anything to go back to; afterwards the conversation itself is the link.
  const hasConversation = useChatStore((state) => (state.privateMessagesByPeer[peerId]?.length ?? 0) > 0);
  const muted = useBlockStore((state) => state.muted[peerId] === true);
  const toggleMuted = useBlockStore((state) => state.toggle);
  const styles = useThemedStyles(({ colors, radii, spacing, typography }) => ({
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing(3) },
    backLink: { color: colors.text, fontWeight: '600' as const, marginBottom: spacing(3) },
    emptyState: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, gap: spacing(1) },
    emptyIcon: { width: 56, height: 56, tintColor: colors.textMuted },
    emptySubtitle: { ...typography.subtitle, textAlign: 'center' as const },
    identity: { alignItems: 'center' as const, gap: spacing(1), marginBottom: spacing(4) },
    name: { ...typography.title, fontSize: 22 },
    label: typography.label,
    locationDetail: { ...typography.subtitle, fontSize: 13 },
    contactCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing(2.5),
      marginBottom: spacing(3),
    },
    contactValue: { ...typography.body, fontWeight: '700' as const, marginTop: spacing(1), fontSize: 17 },
    contactEmpty: { ...typography.subtitle, marginTop: spacing(1) },
    cta: {
      marginTop: 'auto' as const,
      backgroundColor: colors.accent,
      borderRadius: radii.pill,
      paddingVertical: spacing(2),
      alignItems: 'center' as const,
    },
    ctaText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' as const },
    openChat: { marginTop: 'auto' as const, paddingVertical: spacing(2), alignItems: 'center' as const },
    openChatText: { ...typography.body, fontWeight: '700' as const },
    mute: { paddingVertical: spacing(2), alignItems: 'center' as const },
    muteText: { color: colors.danger, fontWeight: '600' as const, fontSize: 14 },
    muteUndo: { ...typography.subtitle, fontSize: 14, fontWeight: '600' as const },
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top + themeSpacing(2), paddingBottom: insets.bottom + themeSpacing(3) }]}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.backLink}>← {t.common.back}</Text>
      </Pressable>

      {!profile ? (
        <View style={styles.emptyState}>
          <Image source={require('../../assets/icons/standing.png')} style={styles.emptyIcon} resizeMode="contain" />
          <Text style={styles.emptySubtitle}>{t.profile.notArrivedYet}</Text>
        </View>
      ) : (
        <>
          <View style={styles.identity}>
            <Avatar peerId={peerId} nickname={profile.nickname} size={88} zoomable />
            <Text style={[styles.name, { color: colorForPeer(peerId) }]}>{profile.nickname}</Text>
            <LocationBadge label={formatLocation(profile.location)} location={profile.location} />
            <Text style={styles.locationDetail}>{describeLocation(profile.location)}</Text>
          </View>

          <View style={styles.contactCard}>
            <Text style={styles.label}>{t.profile.contactLabel}</Text>
            {profile.contact ? (
              <Text style={styles.contactValue}>{profile.contact}</Text>
            ) : (
              <Text style={styles.contactEmpty}>{t.profile.noContactShared}</Text>
            )}
          </View>

          {hasConversation ? (
            <Pressable style={styles.openChat} onPress={() => navigation.navigate('Chat', { peerId })}>
              <Text style={styles.openChatText}>{t.profile.openConversation}</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.cta} onPress={() => navigation.navigate('Chat', { peerId })}>
              <Text style={styles.ctaText}>{t.profile.sendPrivateMessage}</Text>
            </Pressable>
          )}

          <Pressable style={styles.mute} onPress={() => void toggleMuted(peerId)}>
            <Text style={muted ? styles.muteUndo : styles.muteText}>
              {muted ? t.profile.unmute : t.profile.mute}
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
