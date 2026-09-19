import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/RootNavigator';
import { SeatBadge } from '../../components/SeatBadge';
import { useDiscoveryStore } from '../../state/discoveryStore';
import { colorForPeer } from '../../theme';
import { useAppTheme, useThemedStyles } from '../../theme/ThemeContext';

type Props = NativeStackScreenProps<MainStackParamList, 'Profile'>;

/** Reached by tapping someone's name anywhere in the app. Shows only what they chose to share. */
export function ProfileScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { spacing: themeSpacing } = useAppTheme();
  const { peerId } = route.params;
  const peer = useDiscoveryStore((state) => state.peers[peerId]);
  const profile = peer?.profile;
  const styles = useThemedStyles(({ colors, radii, spacing, typography }) => ({
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing(3) },
    backLink: { color: colors.text, fontWeight: '600' as const, marginBottom: spacing(3) },
    emptyState: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, gap: spacing(1) },
    emptyIcon: { width: 56, height: 56, tintColor: colors.textMuted },
    emptySubtitle: { ...typography.subtitle, textAlign: 'center' as const },
    identity: { alignItems: 'center' as const, gap: spacing(1), marginBottom: spacing(4) },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: radii.pill,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: spacing(1),
    },
    avatarText: { color: colors.text, fontWeight: '700' as const, fontSize: 32 },
    name: { ...typography.title, fontSize: 22 },
    label: typography.label,
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
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top + themeSpacing(2), paddingBottom: insets.bottom + themeSpacing(3) }]}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.backLink}>← Volver</Text>
      </Pressable>

      {!profile ? (
        <View style={styles.emptyState}>
          <Image source={require('../../assets/icons/standing.png')} style={styles.emptyIcon} resizeMode="contain" />
          <Text style={styles.emptySubtitle}>Todavía no ha llegado su perfil.</Text>
        </View>
      ) : (
        <>
          <View style={styles.identity}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile.nickname.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={[styles.name, { color: colorForPeer(peerId) }]}>{profile.nickname}</Text>
            <SeatBadge seat={profile.seat} />
          </View>

          <View style={styles.contactCard}>
            <Text style={styles.label}>CONTACTO</Text>
            {profile.contact ? (
              <Text style={styles.contactValue}>{profile.contact}</Text>
            ) : (
              <Text style={styles.contactEmpty}>No ha compartido ningún contacto.</Text>
            )}
          </View>

          <Pressable style={styles.cta} onPress={() => navigation.navigate('Chat', { peerId })}>
            <Text style={styles.ctaText}>Enviar mensaje privado</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
