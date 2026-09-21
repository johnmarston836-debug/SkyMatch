import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/RootNavigator';
import { Avatar } from '../../components/Avatar';
import { BackLink } from '../../components/BackLink';
import { GlassButton } from '../../components/GlassButton';
import { LocationBadge } from '../../components/LocationBadge';
import { useChatStore } from '../../state/chatStore';
import { useDiscoveryStore } from '../../state/discoveryStore';
import { colorForPeer } from '../../theme';
import { describeLocation, formatLocation } from '../../utils/location';
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
  const styles = useThemedStyles(({ colors, radii, spacing, typography }) => ({
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing(3) },
    backRow: { alignItems: 'flex-start' as const, marginBottom: spacing(3) },
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
    cta: { marginTop: 'auto' as const },
    ctaText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' as const },
    openChat: { marginTop: 'auto' as const, paddingVertical: spacing(2), alignItems: 'center' as const },
    openChatText: { ...typography.body, fontWeight: '700' as const },
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top + themeSpacing(2), paddingBottom: insets.bottom + themeSpacing(3) }]}>
      <View style={styles.backRow}>
        <BackLink onPress={() => navigation.goBack()} />
      </View>

      {!profile ? (
        <View style={styles.emptyState}>
          <Image source={require('../../assets/icons/standing.png')} style={styles.emptyIcon} resizeMode="contain" />
          <Text style={styles.emptySubtitle}>Todavía no ha llegado su perfil.</Text>
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
            <Text style={styles.label}>CONTACTO</Text>
            {profile.contact ? (
              <Text style={styles.contactValue}>{profile.contact}</Text>
            ) : (
              <Text style={styles.contactEmpty}>No ha compartido ningún contacto.</Text>
            )}
          </View>

          {hasConversation ? (
            <Pressable style={styles.openChat} onPress={() => navigation.navigate('Chat', { peerId })}>
              <Text style={styles.openChatText}>Abrir conversación</Text>
            </Pressable>
          ) : (
            <GlassButton
              variant="accent"
              size="lg"
              style={styles.cta}
              onPress={() => navigation.navigate('Chat', { peerId })}
            >
              <Text style={styles.ctaText}>Enviar mensaje privado</Text>
            </GlassButton>
          )}
        </>
      )}
    </View>
  );
}
